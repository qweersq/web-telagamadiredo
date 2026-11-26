import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import tenantService from '../../services/tenantService';
import { validateFullPhone } from '../../utils/phoneValidation';
import PhoneInputWithCountry from '../../components/PhoneInput/PhoneInputWithCountry';
import { 
  FaBuilding, 
  FaUser, 
  FaEnvelope, 
  FaPhone, 
  FaMapMarkerAlt, 
  FaCalendarAlt,
  FaEdit,
  FaSave,
  FaTimes,
  FaArrowLeft,
  FaSpinner
} from 'react-icons/fa';
import AnimatedButton from '../../components/Design/AnimatedButton';

const TenantEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [formData, setFormData] = useState({
    business_name: '',
    owner_name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    status: '',
    subscription_status: '',
    trial_end_date: '',
    settings: {}
  });

  useEffect(() => {
    fetchTenantData();
  }, [id]);

  const fetchTenantData = async () => {
    try {
      setInitialLoading(true);
      const response = await tenantService.getTenantById(id);
      const tenant = response.data;
      
      setFormData({
        business_name: tenant.business_name || '',
        owner_name: tenant.owner_name || '',
        email: tenant.email || '',
        phone: tenant.phone || '',
        address: tenant.address || '',
        city: tenant.city || '',
        status: tenant.status || '',
        subscription_status: tenant.subscription_status || '',
        trial_end_date: tenant.trial_end_date ? new Date(tenant.trial_end_date).toISOString().split('T')[0] : '',
        settings: tenant.settings || {}
      });
    } catch (error) {
      console.error('Error fetching tenant data:', error);
      alert('Gagal memuat data tenant');
      navigate('/tenants');
    } finally {
      setInitialLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.business_name || !formData.owner_name || !formData.email || !formData.phone || !formData.address) {
      alert('Mohon lengkapi semua field yang wajib diisi');
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      alert('Format email tidak valid');
      return;
    }

    const phoneError = validateFullPhone(formData.phone);
    if (phoneError) { alert(phoneError); return; }

    try {
      setLoading(true);
      
      // Prepare data for update
      const updateData = { ...formData };
      if (updateData.trial_end_date) {
        updateData.trial_end_date = new Date(updateData.trial_end_date).toISOString();
      }

      await tenantService.updateTenant(id, updateData);
      alert('Tenant berhasil diperbarui');
      navigate(`/tenants/${id}`);
    } catch (error) {
      console.error('Error updating tenant:', error);
      const errorMessage = error.response?.data?.message || 'Gagal memperbarui tenant';
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate(`/tenants/${id}`);
  };

  if (initialLoading) {
    return (
      <div className="h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center font-montserrat">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mx-auto"></div>
          <p className="mt-6 text-lg font-semibold text-gray-700">Memuat data tenant...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-50 font-montserrat flex flex-col overflow-hidden">
      {/* Header */}
      <div className="bg-white shadow-sm border-b flex-shrink-0">
        <div className="px-4 py-4">
          <div className="flex items-center gap-4">
            <AnimatedButton
              onClick={handleCancel}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-all duration-200"
            >
              <FaTimes className="text-lg" />
            </AnimatedButton>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-500 rounded-lg">
                <FaEdit className="text-white text-lg" />
              </div>
              <div>
                <h1 className="text-xl font-montserrat text-gray-900">Edit Tenant</h1>
                <p className="text-xs text-gray-600 font-montserrat">Perbarui informasi tenant</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 space-y-6 pb-8">

          {/* Form */}
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Business Information */}
              <div className="bg-blue-50 rounded-xl p-4">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <FaBuilding className="text-blue-600 text-sm" />
                  </div>
                  <h3 className="text-lg font-montserrat text-gray-900">Informasi Bisnis</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-xs font-semibold text-gray-700 font-montserrat">
                      <FaBuilding className="text-blue-500" />
                      Nama Bisnis <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="business_name"
                      value={formData.business_name}
                      onChange={handleInputChange}
                      required
                      maxLength={25}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm font-montserrat text-gray-900 placeholder-gray-400"
                      placeholder="Contoh: Laundry Sepatu ABC"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-xs font-semibold text-gray-700 font-montserrat">
                      <FaMapMarkerAlt className="text-green-500" />
                      Kota <span className="text-gray-400">(Opsional)</span>
                    </label>
                    <input
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm font-montserrat text-gray-900 placeholder-gray-400"
                      placeholder="Contoh: Jakarta"
                    />
                  </div>
                </div>
              </div>

            {/* Owner Information */}
            <div className="bg-green-50 rounded-xl p-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-green-100 rounded-lg">
                  <FaUser className="text-green-600 text-sm" />
                </div>
                <h3 className="text-lg font-montserrat text-gray-900">Informasi Pemilik</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-xs font-semibold text-gray-700 font-montserrat">
                    <FaUser className="text-green-500" />
                    Nama Pemilik <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="owner_name"
                    value={formData.owner_name}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm font-montserrat text-gray-900 placeholder-gray-400"
                    placeholder="Contoh: John Doe"
                  />
                </div>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-xs font-semibold text-gray-700 font-montserrat">
                    <FaEnvelope className="text-purple-500" />
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm font-montserrat text-gray-900 placeholder-gray-400"
                    placeholder="Contoh: john@example.com"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <PhoneInputWithCountry
                    value={formData.phone}
                    onChange={(full) => setFormData(prev => ({ ...prev, phone: full }))}
                    label="Nomor Telepon"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Address */}
            <div className="bg-orange-50 rounded-xl p-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <FaMapMarkerAlt className="text-orange-600 text-sm" />
                </div>
                <h3 className="text-lg font-montserrat text-gray-900">Alamat Bisnis</h3>
              </div>
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-xs font-semibold text-gray-700 font-montserrat">
                  <FaMapMarkerAlt className="text-orange-500" />
                  Alamat Lengkap <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  required
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm font-montserrat text-gray-900 placeholder-gray-400 resize-none"
                  placeholder="Alamat lengkap bisnis laundry"
                />
              </div>
            </div>

            {/* Status Information */}
            <div className="bg-purple-50 rounded-xl p-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <FaCalendarAlt className="text-purple-600 text-sm" />
                </div>
                <h3 className="text-lg font-montserrat text-gray-900">Status & Langganan</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-xs font-semibold text-gray-700 font-montserrat">
                    <FaBuilding className="text-purple-500" />
                    Status Bisnis
                  </label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm font-montserrat text-gray-900"
                  >
                    <option value="trial">Trial</option>
                    <option value="active">Aktif</option>
                    <option value="inactive">Tidak Aktif</option>
                    <option value="suspended">Ditangguhkan</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-xs font-semibold text-gray-700 font-montserrat">
                    <FaCalendarAlt className="text-pink-500" />
                    Status Langganan
                  </label>
                  <select
                    name="subscription_status"
                    value={formData.subscription_status}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm font-montserrat text-gray-900"
                  >
                    <option value="trial">Trial</option>
                    <option value="active">Aktif</option>
                    <option value="expired">Kadaluarsa</option>
                    <option value="cancelled">Dibatalkan</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-xs font-semibold text-gray-700 font-montserrat">
                    <FaCalendarAlt className="text-red-500" />
                    Trial Berakhir
                  </label>
                  <input
                    type="date"
                    name="trial_end_date"
                    value={formData.trial_end_date}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm font-montserrat text-gray-900"
                  />
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="flex flex-col sm:flex-row justify-end gap-3">
                <AnimatedButton
                  type="button"
                  onClick={handleCancel}
                  className="bg-gray-500 text-white px-6 py-2 rounded-lg text-sm font-semibold font-montserrat hover:bg-gray-600 transition-all duration-200 flex items-center justify-center gap-2"
                >
                  <FaArrowLeft className="text-sm" />
                  Batal
                </AnimatedButton>
                <AnimatedButton
                  type="submit"
                  disabled={loading}
                  className="bg-blue-500 text-white px-6 py-2 rounded-lg text-sm font-semibold font-montserrat hover:bg-blue-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <FaSpinner className="text-sm animate-spin" />
                      Menyimpan...
                    </>
                  ) : (
                    <>
                      <FaSave className="text-sm" />
                      Simpan Perubahan
                    </>
                  )}
                </AnimatedButton>
              </div>
            </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TenantEdit;
