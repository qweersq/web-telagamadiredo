import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AnimatedButton from '../components/Design/AnimatedButton';
import TermsAndConditions from '../components/Legal/TermsAndConditions';
import PrivacyPolicy from '../components/Legal/PrivacyPolicy';
import instance from '../config/api';
import { validateFullPhone } from '../utils/phoneValidation';
import PhoneInputWithCountry from '../components/PhoneInput/PhoneInputWithCountry';
import fbPixel from '../utils/facebookPixel';
import ga4 from '../utils/googleAnalytics';
import {
  FaArrowLeft,
  FaBuilding,
  FaUser,
  FaCheckCircle,
  FaExclamationTriangle,
  FaSpinner,
  FaEye,
  FaEyeSlash,
  FaLock
} from 'react-icons/fa';

const OrderForm = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    business_name: '',
    owner_name: '',
    email: '',
    business_whatsapp: '',
    owner_whatsapp: '',
    address: '',
    city: '',
    selected_plan: 'NotaPro',
    plan_id: 1,
    password: '',
    confirm_password: ''
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [showTerms, setShowTerms] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const topRef = useRef(null);

  useEffect(() => {
    if (topRef.current) {
      topRef.current.scrollIntoView({ behavior: 'instant' });
    }

    // ✅ Funnel Step 3: Order Form View (begin checkout)
    ga4.trackOrderForm('', 0);
    fbPixel.addToCart('Order Form Visit', 0);
  }, []);

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

    if (!formData.business_name.trim()) {
      newErrors.business_name = 'Nama bisnis harus diisi';
    } else if (formData.business_name.trim().length > 25) {
      // Batas 25 karakter — box header thermal printer hanya 32 karakter (lebih dari 30 bisa bikin print gagal)
      newErrors.business_name = 'Nama bisnis maksimal 25 karakter';
    }

    if (!formData.owner_name.trim()) {
      newErrors.owner_name = 'Nama pemilik harus diisi';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email harus diisi';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Format email tidak valid';
    }

    const bwaError = validateFullPhone(formData.business_whatsapp);
    if (bwaError) newErrors.business_whatsapp = bwaError;

    const owaError = validateFullPhone(formData.owner_whatsapp);
    if (owaError) newErrors.owner_whatsapp = owaError;

    if (!formData.address.trim()) {
      newErrors.address = 'Alamat harus diisi';
    }

    if (!formData.city.trim()) {
      newErrors.city = 'Kota harus diisi';
    }

    // Password validation
    if (!formData.password.trim()) {
      newErrors.password = 'Password harus diisi';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password minimal 8 karakter';
    } else if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password = 'Password harus mengandung minimal 1 huruf kecil, 1 huruf besar, dan 1 angka';
    }

    if (!formData.confirm_password.trim()) {
      newErrors.confirm_password = 'Konfirmasi password harus diisi';
    } else if (formData.password !== formData.confirm_password) {
      newErrors.confirm_password = 'Password dan konfirmasi password tidak cocok';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Password strength checker
  const getPasswordStrength = (password) => {
    if (!password) return { strength: 0, label: '', color: '' };

    let strength = 0;
    const checks = {
      length: password.length >= 8,
      lowercase: /[a-z]/.test(password),
      uppercase: /[A-Z]/.test(password),
      number: /\d/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    };

    strength = Object.values(checks).filter(Boolean).length;

    if (strength <= 2) return { strength, label: 'Lemah', color: 'text-red-600 bg-red-100' };
    if (strength <= 3) return { strength, label: 'Sedang', color: 'text-yellow-600 bg-yellow-100' };
    if (strength <= 4) return { strength, label: 'Kuat', color: 'text-green-600 bg-green-100' };
    return { strength, label: 'Sangat Kuat', color: 'text-green-700 bg-green-200' };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setSubmitError(''); // Clear previous errors

    try {
      // Submit order to API
      const response = await instance.post('/tenant-orders', formData);

      if (response.data.success) {
        // ✅ Funnel Step 4: Registration Success (CONVERSION!)
        ga4.trackRegistration('NotaPro', 149000, formData.email);
        fbPixel.completeRegistration('NotaPro', 149000, formData.email);

        // Show success alert
        alert('✅ Registrasi Berhasil!\n\nAkun bisnis Anda telah berhasil dibuat.\nSilakan login dengan email dan password yang sudah Anda buat.\n\nEmail: ' + formData.email);

        // Navigate to login page
        navigate('/login', {
          state: {
            message: 'Akun berhasil dibuat! Silakan login dengan email dan password yang Anda buat.',
            email: formData.email
          }
        });
      } else {
        throw new Error(response.data.message || 'Gagal mengirim data');
      }

    } catch (error) {

      // ✅ IMPROVED: Better error handling
      let errorMessage = 'Gagal mengirim data. Silakan coba lagi.';

      if (error.response?.data?.error?.message) {
        errorMessage = error.response.data.error.message;
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }

      setSubmitError(errorMessage);

      // Scroll to error message
      if (topRef.current) {
        topRef.current.scrollIntoView({ behavior: 'smooth' });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleBackToPricing = () => {
    navigate('/pricing');
  };

  return (
    <div ref={topRef} className="min-h-screen bg-gray-50 font-montserrat">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={handleBackToPricing}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <FaArrowLeft className="text-gray-600 text-lg" />
            </button>
            <div className="flex items-center gap-3 flex-1">
              <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                <FaBuilding className="text-white text-xl" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h1 className="text-lg font-semibold font-montserrat text-gray-900">Form Registrasi</h1>
                  <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-xs font-medium">
                    <FaCheckCircle className="text-xs" />
                    Trial 7 Hari
                  </span>
                </div>
                <p className="text-xs text-gray-600 font-montserrat">
                  Daftar untuk trial NotaPro gratis 7 hari - Belum perlu bayar sekarang
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1">
          {/* Form */}
          <div>
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-2">
                  <h2 className="text-lg font-semibold font-montserrat text-gray-900">Data Bisnis</h2>
                  <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-xs font-semibold">
                    Registrasi Gratis
                  </span>
                </div>
                <p className="text-gray-700 font-montserrat font-semibold">
                  Lengkapi informasi bisnis untuk trial NotaPro gratis 7 hari. Anda belum dikenakan biaya.
                </p>
              </div>

              {/* ✅ NEW: Submit Error Display */}
              {submitError && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
                  <div className="flex items-center gap-3">
                    <FaExclamationTriangle className="text-red-500 text-lg" />
                    <div>
                      <h4 className="text-red-800 font-semibold font-montserrat">Terjadi Kesalahan</h4>
                      <p className="text-red-700 text-sm font-montserrat mt-1">{submitError}</p>
                    </div>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Business Information */}
                <div className="bg-blue-50 rounded-xl p-4">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <FaBuilding className="text-blue-600 text-lg" />
                    </div>
                    <h3 className="text-lg font-montserrat text-gray-900">Informasi Bisnis</h3>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2 font-montserrat">
                        Nama Bisnis <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="business_name"
                        value={formData.business_name}
                        onChange={handleInputChange}
                        maxLength={25}
                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-montserrat ${errors.business_name ? 'border-red-300 bg-red-50' : 'border-gray-300'
                          }`}
                        placeholder="Contoh: ShoeCareABC"
                      />
                      <p className="mt-1 text-xs text-gray-500 font-montserrat">
                        Maksimal 25 karakter (agar rapi saat dicetak di struk)
                      </p>
                      {errors.business_name && (
                        <div className="flex items-center gap-2 mt-2 text-red-600 text-sm">
                          <FaExclamationTriangle className="text-xs" />
                          <span className="font-montserrat">{errors.business_name}</span>
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2 font-montserrat">
                        Kota <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="city"
                        value={formData.city}
                        onChange={handleInputChange}
                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-montserrat ${errors.city ? 'border-red-300 bg-red-50' : 'border-gray-300'
                          }`}
                        placeholder="Contoh: Jakarta"
                      />
                      {errors.city && (
                        <div className="flex items-center gap-2 mt-2 text-red-600 text-sm">
                          <FaExclamationTriangle className="text-xs" />
                          <span className="font-montserrat">{errors.city}</span>
                        </div>
                      )}
                    </div>

                    <div>
                      <PhoneInputWithCountry
                        value={formData.business_whatsapp}
                        onChange={(full) => {
                          setFormData(prev => ({ ...prev, business_whatsapp: full }));
                          if (errors.business_whatsapp) setErrors(prev => ({ ...prev, business_whatsapp: '' }));
                        }}
                        error={errors.business_whatsapp}
                        label="Nomor WhatsApp Bisnis"
                        required
                      />
                      <p className="text-xs text-gray-600 mt-1 font-montserrat">
                        Nomor WhatsApp toko/outlet untuk customer
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2 font-montserrat">
                        Alamat Lengkap <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        name="address"
                        value={formData.address}
                        onChange={handleInputChange}
                        rows={3}
                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-montserrat resize-none ${errors.address ? 'border-red-300 bg-red-50' : 'border-gray-300'
                          }`}
                        placeholder="Alamat lengkap bisnis laundry Anda"
                      />
                      {errors.address && (
                        <div className="flex items-center gap-2 mt-2 text-red-600 text-sm">
                          <FaExclamationTriangle className="text-xs" />
                          <span className="font-montserrat">{errors.address}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Owner Information */}
                <div className="bg-green-50 rounded-xl p-4">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <FaUser className="text-green-600 text-lg" />
                    </div>
                    <h3 className="text-lg font-montserrat text-gray-900">Informasi Pemilik</h3>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2 font-montserrat">
                        Nama Pemilik <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="owner_name"
                        value={formData.owner_name}
                        onChange={handleInputChange}
                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent font-montserrat ${errors.owner_name ? 'border-red-300 bg-red-50' : 'border-gray-300'
                          }`}
                        placeholder=""
                      />
                      {errors.owner_name && (
                        <div className="flex items-center gap-2 mt-2 text-red-600 text-sm">
                          <FaExclamationTriangle className="text-xs" />
                          <span className="font-montserrat">{errors.owner_name}</span>
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2 font-montserrat">
                        Email <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent font-montserrat ${errors.email ? 'border-red-300 bg-red-50' : 'border-gray-300'
                          }`}
                        placeholder="Contoh: john@example.com"
                      />
                      {errors.email && (
                        <div className="flex items-center gap-2 mt-2 text-red-600 text-sm">
                          <FaExclamationTriangle className="text-xs" />
                          <span className="font-montserrat">{errors.email}</span>
                        </div>
                      )}
                    </div>

                    <div>
                      <PhoneInputWithCountry
                        value={formData.owner_whatsapp}
                        onChange={(full) => {
                          setFormData(prev => ({ ...prev, owner_whatsapp: full }));
                          if (errors.owner_whatsapp) setErrors(prev => ({ ...prev, owner_whatsapp: '' }));
                        }}
                        error={errors.owner_whatsapp}
                        label="Nomor WhatsApp Owner"
                        required
                      />
                      <p className="text-xs text-gray-600 mt-1 font-montserrat">
                        Untuk notifikasi dan login ke sistem
                      </p>
                    </div>
                  </div>
                </div>

                {/* Password Section */}
                <div className="bg-purple-50 rounded-xl p-4">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <FaLock className="text-purple-600 text-lg" />
                    </div>
                    <h3 className="text-lg font-montserrat text-gray-900">Password untuk Login Akun Owner</h3>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2 font-montserrat">
                        Password <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword ? "text" : "password"}
                          name="password"
                          value={formData.password}
                          onChange={handleInputChange}
                          className={`w-full px-4 py-3 pr-12 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent font-montserrat ${errors.password ? 'border-red-300 bg-red-50' : 'border-gray-300'
                            }`}
                          placeholder="Masukkan password yang kuat"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                        >
                          {showPassword ? <FaEyeSlash /> : <FaEye />}
                        </button>
                      </div>

                      {/* Password Strength Indicator */}
                      {formData.password && (
                        <div className="mt-2">
                          <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${getPasswordStrength(formData.password).color}`}>
                            Kekuatan: {getPasswordStrength(formData.password).label}
                          </div>
                          <div className="mt-1 flex space-x-1">
                            {[1, 2, 3, 4, 5].map((level) => (
                              <div
                                key={level}
                                className={`h-1 flex-1 rounded ${level <= getPasswordStrength(formData.password).strength
                                    ? getPasswordStrength(formData.password).strength <= 2
                                      ? 'bg-red-400'
                                      : getPasswordStrength(formData.password).strength <= 3
                                        ? 'bg-yellow-400'
                                        : 'bg-green-400'
                                    : 'bg-gray-200'
                                  }`}
                              />
                            ))}
                          </div>
                        </div>
                      )}

                      {errors.password && (
                        <div className="flex items-center gap-2 mt-2 text-red-600 text-sm">
                          <FaExclamationTriangle className="text-xs" />
                          <span className="font-montserrat">{errors.password}</span>
                        </div>
                      )}

                      <div className="mt-2 text-xs text-gray-600 font-montserrat">
                        Password harus minimal 8 karakter dengan kombinasi huruf besar, huruf kecil, dan angka
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2 font-montserrat">
                        Konfirmasi Password <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type={showConfirmPassword ? "text" : "password"}
                          name="confirm_password"
                          value={formData.confirm_password}
                          onChange={handleInputChange}
                          className={`w-full px-4 py-3 pr-12 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent font-montserrat ${errors.confirm_password ? 'border-red-300 bg-red-50' : 'border-gray-300'
                            }`}
                          placeholder="Ulangi password yang sama"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                        >
                          {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                        </button>
                      </div>

                      {/* Password Match Indicator */}
                      {formData.confirm_password && (
                        <div className="mt-2">
                          {formData.password === formData.confirm_password ? (
                            <div className="flex items-center gap-2 text-green-600 text-sm">
                              <FaCheckCircle className="text-xs" />
                              <span className="font-montserrat">Password cocok</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 text-red-600 text-sm">
                              <FaExclamationTriangle className="text-xs" />
                              <span className="font-montserrat">Password tidak cocok</span>
                            </div>
                          )}
                        </div>
                      )}

                      {errors.confirm_password && (
                        <div className="flex items-center gap-2 mt-2 text-red-600 text-sm">
                          <FaExclamationTriangle className="text-xs" />
                          <span className="font-montserrat">{errors.confirm_password}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Terms and Conditions */}
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    id="terms"
                    className="mt-1"
                    required
                  />
                  <label htmlFor="terms" className="text-sm text-gray-700 font-montserrat">
                    Saya menyetujui{' '}
                    <button
                      type="button"
                      onClick={() => setShowTerms(true)}
                      className="text-blue-600 hover:underline"
                    >
                      Syarat dan Ketentuan
                    </button>{' '}
                    serta{' '}
                    <button
                      type="button"
                      onClick={() => setShowPrivacy(true)}
                      className="text-blue-600 hover:underline"
                    >
                      Kebijakan Privasi
                    </button>{' '}
                    NotaSepatu.
                  </label>
                </div>

                {/* Submit Button */}
                <div className="flex flex-col sm:flex-row gap-4">
                  <AnimatedButton
                    type="button"
                    onClick={handleBackToPricing}
                    variant="outline"
                    className="flex-1 py-3 px-6 text-lg font-semibold font-montserrat"
                  >
                    Kembali ke Paket
                  </AnimatedButton>
                  <AnimatedButton
                    type="submit"
                    disabled={loading}
                    variant="blue"
                    className="flex-1 py-3 px-6 text-lg font-semibold font-montserrat disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <FaSpinner className="animate-spin" />
                        Mengirim Data...
                      </>
                    ) : (
                      <>
                        Daftar & Mulai Trial Gratis
                        <FaCheckCircle className="text-sm" />
                      </>
                    )}
                  </AnimatedButton>
                </div>
                <p className="text-center text-xs text-gray-500 mt-2 font-montserrat">
                  <FaCheckCircle className="inline text-green-500 mr-1" />
                  Belum dikenakan biaya - Bayar setelah trial selesai jika Anda puas
                </p>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Legal Modals */}
      <TermsAndConditions
        isOpen={showTerms}
        onClose={() => setShowTerms(false)}
      />
      <PrivacyPolicy
        isOpen={showPrivacy}
        onClose={() => setShowPrivacy(false)}
      />
    </div>
  );
};

export default OrderForm;
