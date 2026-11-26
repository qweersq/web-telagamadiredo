import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import tenantService from '../../services/tenantService';
import AnimatedButton from '../../components/Design/AnimatedButton';
import { validateFullPhone } from '../../utils/phoneValidation';
import { FaBuilding, FaUser, FaEnvelope, FaMapMarkerAlt, FaCity, FaArrowLeft, FaSave, FaSpinner } from 'react-icons/fa';
import PhoneInputWithCountry from '../../components/PhoneInput/PhoneInputWithCountry';

const TenantCreate = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    business_name: '',
    owner_name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    settings: {}
  });

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
      await tenantService.createTenant(formData);
      alert('Tenant berhasil dibuat');
      navigate('/tenants');
    } catch (error) {
      console.error('Error creating tenant:', error);
      const errorMessage = error.response?.data?.message || 'Gagal membuat tenant';
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/tenant-list');
  };

  return (
    <div className="h-screen bg-gray-50 font-montserrat flex flex-col overflow-hidden">
      {/* Header */}
      <div className="bg-white shadow-sm border-b flex-shrink-0">
        <div className="px-4 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={handleCancel}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-all duration-200"
              title="Kembali"
            >
              <FaArrowLeft className="text-lg" />
            </button>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500 rounded-lg">
                <FaBuilding className="text-white text-xl" />
              </div>
              <div>
                <h1 className="text-lg font-semibold font-montserrat text-gray-900">Tambah Tenant Baru</h1>
                <p className="text-sm text-gray-600 font-montserrat">Buat tenant baru untuk bisnis laundry sepatu</p>
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
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Business Information */}
              <div className="bg-blue-50 rounded-xl p-4">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <FaBuilding className="text-blue-600 text-lg" />
                  </div>
                  <h3 className="text-lg font-montserrat text-gray-900">Informasi Bisnis</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-2 flex items-center gap-2 font-montserrat">
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm font-montserrat placeholder-gray-400"
                      placeholder="Contoh: Laundry Sepatu ABC"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                    <FaCity className="text-green-500" />
                    Kota <span className="text-gray-400 text-sm">(Opsional)</span>
                  </label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 font-medium placeholder-gray-400"
                    placeholder="Contoh: Jakarta"
                  />
                </div>
              </div>
            </div>

            {/* Owner Information */}
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-100">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg">
                  <FaUser className="text-white text-lg" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 font-montserrat tracking-wide">Informasi Pemilik</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                    <FaUser className="text-green-500" />
                    Nama Pemilik <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="owner_name"
                    value={formData.owner_name}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 font-medium placeholder-gray-400"
                    placeholder="Contoh: John Doe"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                    <FaEnvelope className="text-purple-500" />
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 font-medium placeholder-gray-400"
                    placeholder="Contoh: john@example.com"
                  />
                </div>
                <div className="md:col-span-2">
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
            <div className="bg-gradient-to-r from-orange-50 to-yellow-50 rounded-2xl p-6 border border-orange-100">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-gradient-to-r from-orange-500 to-yellow-600 rounded-lg">
                  <FaMapMarkerAlt className="text-white text-lg" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 font-montserrat tracking-wide">Alamat Bisnis</h3>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                  <FaMapMarkerAlt className="text-orange-500" />
                  Alamat Lengkap <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  required
                  rows={4}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200 font-medium placeholder-gray-400 resize-none"
                  placeholder="Alamat lengkap bisnis laundry sepatu..."
                />
              </div>
            </div>

            {/* Trial Information */}
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-6 border border-purple-100">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <div className="p-3 bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl">
                    <svg className="h-6 w-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-purple-800 font-montserrat tracking-wide mb-3">Informasi Trial</h3>
                  <div className="text-purple-700 font-medium">
                    <p className="mb-3">Tenant baru akan mendapatkan:</p>
                    <ul className="space-y-2">
                      <li className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                        Masa trial 14 hari gratis
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                        Akses penuh ke semua fitur aplikasi
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                        Dukungan teknis selama periode trial
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                        Setup dan konfigurasi awal gratis
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row justify-end gap-4 pt-8 border-t-2 border-gray-100">
              <AnimatedButton
                type="button"
                onClick={handleCancel}
                variant="grey"
                className="flex items-center justify-center gap-2 px-6 py-3 text-base font-semibold"
              >
                <FaArrowLeft className="text-lg" />
                Batal
              </AnimatedButton>
              <AnimatedButton
                type="submit"
                disabled={loading}
                variant="blue"
                className="flex items-center justify-center gap-2 px-6 py-3 text-base font-semibold"
              >
                {loading ? (
                  <>
                    <FaSpinner className="text-lg animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  <>
                    <FaSave className="text-lg" />
                    Simpan Tenant
                  </>
                )}
              </AnimatedButton>
            </div>
          </form>
        </div>
        </div>
      </div>
    </div>
  );
};

export default TenantCreate;
