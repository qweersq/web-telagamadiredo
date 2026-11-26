import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AnimatedButton from '../components/Design/AnimatedButton';
import {
  FaBuilding,
  FaArrowLeft,
  FaUser,
  FaEnvelope,
  FaPhone,
  FaMapMarkerAlt,
  FaIndustry,
  FaUsers,
  FaDollarSign,
  FaClock,
  FaCheckCircle,
  FaWhatsapp,
  FaStar
} from 'react-icons/fa';

const CustomOrderPage = () => {
  const navigate = useNavigate();
  const topRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    // Informasi Pribadi
    fullName: '',
    email: '',
    phone: '',
    company: '',
    position: '',

    // Informasi Bisnis
    businessType: '',
    businessSize: '',
    currentSystem: '',
    locations: '',

    // Kebutuhan Aplikasi
    specificNeeds: '',
    expectedUsers: '',
    expectedBranches: '',
    budget: '',
    timeline: '',

    // Fitur Khusus
    customFeatures: '',
    integrationNeeds: '',
    additionalInfo: ''
  });

  useEffect(() => {
    if (topRef.current) {
      topRef.current.scrollIntoView({ behavior: 'instant' });
    }
  }, []);

  const handleBackToPricing = () => {
    navigate('/pricing');
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
    setLoading(true);

    try {
      // Format pesan WhatsApp
      const message = `*CUSTOM APPS REQUEST - NotaSepatu*

*INFORMASI PRIBADI*
- Nama: ${formData.fullName}
- Email: ${formData.email}
- Phone: ${formData.phone}
- Perusahaan: ${formData.company}
- Posisi: ${formData.position}

*INFORMASI BISNIS*
- Jenis Bisnis: ${formData.businessType}
- Ukuran Bisnis: ${formData.businessSize}
- Sistem Saat Ini: ${formData.currentSystem}
- Lokasi/Cabang: ${formData.locations}

*KEBUTUHAN APLIKASI*
- Kebutuhan Spesifik: ${formData.specificNeeds}
- Jumlah User: ${formData.expectedUsers}
- Jumlah Cabang: ${formData.expectedBranches}
- Budget: ${formData.budget}
- Timeline: ${formData.timeline}

*FITUR KHUSUS*
- Custom Features: ${formData.customFeatures}
- Integrasi: ${formData.integrationNeeds}
- Info Tambahan: ${formData.additionalInfo}

---
Dikirim melalui NotaSepatu Custom Apps Form`.trim();

      // Encode pesan untuk WhatsApp URL
      const encodedMessage = encodeURIComponent(message);
      const whatsappNumber = '6287778942773'; // Ganti dengan nomor WhatsApp pribadi Anda
      const whatsappURL = `https://wa.me/${whatsappNumber}?text=${encodedMessage}`;

      // Buka WhatsApp
      window.open(whatsappURL, '_blank');

      setSuccess(true);

      // Reset form setelah 3 detik
      setTimeout(() => {
        setFormData({
          fullName: '',
          email: '',
          phone: '',
          company: '',
          position: '',
          businessType: '',
          businessSize: '',
          currentSystem: '',
          locations: '',
          specificNeeds: '',
          expectedUsers: '',
          expectedBranches: '',
          budget: '',
          timeline: '',
          customFeatures: '',
          integrationNeeds: '',
          additionalInfo: ''
        });
        setSuccess(false);
      }, 3000);

    } catch (error) {
      console.error('Error:', error);
      alert('Terjadi kesalahan. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div ref={topRef} className="min-h-screen bg-gray-50 font-montserrat flex items-center justify-center">
        <div className="max-w-md mx-auto px-4">
          <div className="bg-white rounded-2xl p-8 shadow-lg text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FaCheckCircle className="text-green-500 text-2xl" />
            </div>
            <h2 className="text-2xl font-montserrat text-gray-900 mb-4">Berhasil Dikirim!</h2>
            <p className="text-gray-600 font-montserrat mb-6">
              Permintaan custom apps Anda telah dikirim melalui WhatsApp.
              Kami akan segera menghubungi Anda untuk konsultasi lebih lanjut.
            </p>
            <AnimatedButton
              onClick={handleBackToPricing}
              className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-semibold"
            >
              Kembali ke Pricing
            </AnimatedButton>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div ref={topRef} className="min-h-screen bg-gray-50 font-montserrat">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={handleBackToPricing}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <FaArrowLeft className="text-gray-600 text-lg" />
              </button>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center">
                  <FaBuilding className="text-white text-xl" />
                </div>
                <div>
                  <h1 className="text-lg font-semibold font-montserrat text-gray-900">Custom Apps</h1>
                  <p className="text-xs text-gray-600 font-montserrat">Aplikasi khusus untuk bisnis Anda</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <div className="bg-gradient-to-br from-purple-50 to-indigo-100 py-12">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 bg-purple-100 text-purple-700 px-4 py-2 rounded-full text-sm font-semibold mb-4">
            <FaStar className="text-xs" />
            Eksklusif Custom Apps
          </div>
          <h1 className="text-3xl md:text-4xl font-montserrat text-gray-900 mb-4">
            Wujudkan Aplikasi Impian Bisnis Anda
          </h1>
          <p className="text-lg text-gray-600 mb-6 max-w-2xl mx-auto font-montserrat">
            Dapatkan aplikasi yang dirancang khusus untuk kebutuhan bisnis Anda dengan
            database personal dan fitur yang sepenuhnya disesuaikan.
          </p>
          <div className="flex items-center justify-center gap-6 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <FaCheckCircle className="text-green-500" />
              <span>Database Personal</span>
            </div>
            <div className="flex items-center gap-2">
              <FaCheckCircle className="text-green-500" />
              <span>Custom Branding</span>
            </div>
            <div className="flex items-center gap-2">
              <FaCheckCircle className="text-green-500" />
              <span>Dedicated Support</span>
            </div>
          </div>
        </div>
      </div>

      {/* Form Section */}
      <div className="py-16">
        <div className="max-w-4xl mx-auto px-4">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Informasi Pribadi */}
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-200">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <FaUser className="text-blue-600 text-sm" />
                </div>
                <h2 className="text-xl font-montserrat text-gray-900">Informasi Pribadi</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Nama *</label>
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Masukkan nama Anda"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Email *</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="nama@email.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Nomor WhatsApp *</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="08123456789"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Nama Usaha</label>
                  <input
                    type="text"
                    name="company"
                    value={formData.company}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="PT. Nama Perusahaan"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Posisi/Jabatan</label>
                  <input
                    type="text"
                    name="position"
                    value={formData.position}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="CEO, Owner, Manager, dll"
                  />
                </div>
              </div>
            </div>

            {/* Informasi Bisnis */}
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-200">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <FaIndustry className="text-green-600 text-sm" />
                </div>
                <h2 className="text-xl font-montserrat text-gray-900">Informasi Bisnis</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Jenis Bisnis *</label>
                  <select
                    name="businessType"
                    value={formData.businessType}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="">Pilih jenis bisnis</option>
                    <option value="Laundry Sepatu">Laundry Sepatu</option>
                    <option value="Laundry Tas">Laundry Tas</option>
                    <option value="Laundry Karpet">Laundry Karpet</option>
                    <option value="Dry Cleaning">Dry Cleaning</option>
                    <option value="Laundry Umum">Laundry Umum</option>
                    <option value="Service Center">Service Center</option>
                    <option value="Retail">Retail</option>
                    <option value="Lainnya">Lainnya</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Ukuran Bisnis *</label>
                  <select
                    name="businessSize"
                    value={formData.businessSize}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="">Pilih ukuran bisnis</option>
                    <option value="Startup (1-10 karyawan)">Startup (1-10 karyawan)</option>
                    <option value="Small Business (11-50 karyawan)">Small Business (11-50 karyawan)</option>
                    <option value="Medium Business (51-200 karyawan)">Medium Business (51-200 karyawan)</option>
                    <option value="Large Enterprise (200+ karyawan)">Large Enterprise (200+ karyawan)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Sistem Saat Ini</label>
                  <input
                    type="text"
                    name="currentSystem"
                    value={formData.currentSystem}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Excel, aplikasi lain, manual, dll"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Jumlah Lokasi/Cabang</label>
                  <input
                    type="text"
                    name="locations"
                    value={formData.locations}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="1 lokasi, 5 cabang, dll"
                  />
                </div>
              </div>
            </div>

            {/* Kebutuhan Aplikasi */}
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-200">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                  <FaBuilding className="text-purple-600 text-sm" />
                </div>
                <h2 className="text-xl font-montserrat text-gray-900">Kebutuhan Aplikasi</h2>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Kebutuhan Spesifik *</label>
                  <textarea
                    name="specificNeeds"
                    value={formData.specificNeeds}
                    onChange={handleInputChange}
                    required
                    rows="4"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Jelaskan kebutuhan spesifik aplikasi yang Anda inginkan..."
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Perkiraan Jumlah User</label>
                    <input
                      type="text"
                      name="expectedUsers"
                      value={formData.expectedUsers}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="10 user, 50 user, dll"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Perkiraan Jumlah Cabang</label>
                    <input
                      type="text"
                      name="expectedBranches"
                      value={formData.expectedBranches}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="1 cabang, 10 cabang, dll"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Budget Range</label>
                    <select
                      name="budget"
                      value={formData.budget}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                      <option value="">Pilih budget range</option>
                      <option value="< 10 juta">&lt; 10 juta</option>
                      <option value="10 - 25 juta">10 - 25 juta</option>
                      <option value="25 - 50 juta">25 - 50 juta</option>
                      <option value="50 - 100 juta">50 - 100 juta</option>
                      <option value="> 100 juta">&gt; 100 juta</option>
                      <option value="Diskusi lebih lanjut">Diskusi lebih lanjut</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Timeline</label>
                    <select
                      name="timeline"
                      value={formData.timeline}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                      <option value="">Pilih timeline</option>
                      <option value="ASAP (< 1 bulan)">ASAP (&lt; 1 bulan)</option>
                      <option value="1-3 bulan">1-3 bulan</option>
                      <option value="3-6 bulan">3-6 bulan</option>
                      <option value="6-12 bulan">6-12 bulan</option>
                      <option value="> 12 bulan">&gt; 12 bulan</option>
                      <option value="Fleksibel">Fleksibel</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Fitur Khusus */}
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-200">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                  <FaStar className="text-orange-600 text-sm" />
                </div>
                <h2 className="text-xl font-montserrat text-gray-900">Fitur Khusus & Integrasi</h2>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Custom Features yang Diinginkan</label>
                  <textarea
                    name="customFeatures"
                    value={formData.customFeatures}
                    onChange={handleInputChange}
                    rows="3"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Fitur khusus yang tidak ada di paket standar..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Kebutuhan Integrasi</label>
                  <textarea
                    name="integrationNeeds"
                    value={formData.integrationNeeds}
                    onChange={handleInputChange}
                    rows="3"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Integrasi dengan sistem lain, API, payment gateway, dll..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Informasi Tambahan</label>
                  <textarea
                    name="additionalInfo"
                    value={formData.additionalInfo}
                    onChange={handleInputChange}
                    rows="3"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Informasi tambahan yang ingin Anda sampaikan..."
                  />
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-200">
              <div className="text-center">
                <div className="mb-6">
                  <h3 className="text-xl font-montserrat font-bold text-gray-900 mb-2">Siap untuk Konsultasi?</h3>
                  <p className="text-gray-600 font-montserrat">
                    Setelah submit, Anda akan diarahkan ke WhatsApp untuk konsultasi langsung dengan tim kami.
                  </p>
                </div>

                <AnimatedButton
                  type="submit"
                  disabled={loading}
                  className="px-8 py-4 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-semibold font-montserrat flex items-center gap-3 mx-auto"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Mengirim...
                    </>
                  ) : (
                    <>
                      <FaWhatsapp className="text-lg" />
                      Kirim ke WhatsApp
                    </>
                  )}
                </AnimatedButton>

                <p className="text-sm text-gray-500 font-montserrat mt-4">
                  * Field yang wajib diisi
                </p>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CustomOrderPage;
