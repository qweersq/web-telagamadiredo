import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import subscriptionPlanService from '../../services/subscriptionPlanService';
import AnimatedButton from '../../components/Design/AnimatedButton';
import { 
  FaArrowLeft, 
  FaSave, 
  FaTimes, 
  FaDollarSign,
  FaCalendarAlt,
  FaUsers,
  FaBuilding,
  FaShoppingCart,
  FaCrown,
  FaStar,
  FaGem,
  FaInfoCircle,
  FaCheckCircle
} from 'react-icons/fa';

const SuperAppCreateSubscriptionPlan = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    duration_days: '',
    max_branches: 1,
    max_users: 5,
    features: {
      daily_reports: true,
      multi_payment: true,
      photo_tracking: true,
      digital_invoice: true,
      priority_support: false,
      role_based_access: true,
      whatsapp_integration: false,
      follow_up_features: false,
      advanced_reporting: false
    },
    is_active: true,
    sort_order: 0
  });

  const [errors, setErrors] = useState({});
  const [displayPrice, setDisplayPrice] = useState('');

  useEffect(() => {
    if (id) {
      setIsEditMode(true);
      fetchPlanData();
    }
  }, [id]);

  const fetchPlanData = async () => {
    try {
      setLoading(true);
      const response = await subscriptionPlanService.getPlanById(id);
      const plan = response.data;
      
      setFormData({
        name: plan.name || '',
        description: plan.description || '',
        price: plan.price || '',
        duration_days: plan.duration_days || '',
        max_branches: plan.max_branches || 1,
        max_users: plan.max_users || 5,
        features: plan.features || {
          daily_reports: true,
          multi_payment: true,
          photo_tracking: true,
          digital_invoice: true,
          priority_support: false,
          role_based_access: true,
          whatsapp_integration: false,
          follow_up_features: false,
          advanced_reporting: false
        },
        is_active: plan.is_active !== undefined ? plan.is_active : true,
        sort_order: plan.sort_order || 0
      });
      setDisplayPrice(formatNumberWithDots(plan.price || ''));
    } catch (error) {
      console.error('Error fetching plan data:', error);
      alert('Gagal memuat data paket');
      navigate('/subscription-plans');
    } finally {
      setLoading(false);
    }
  };

  const handleBackToPlans = () => {
    navigate('/subscription-plans');
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const handleFeatureChange = (feature, value) => {
    setFormData(prev => ({
      ...prev,
      features: {
        ...prev.features,
        [feature]: value
      }
    }));
  };

  const handlePriceChange = (value) => {
    // Remove non-numeric characters except dots
    const numericValue = value.replace(/[^\d.]/g, '');
    
    // Format with dots
    const formattedValue = formatNumberWithDots(numericValue);
    setDisplayPrice(formattedValue);
    
    // Store the numeric value without dots
    const numericOnly = parseNumberFromDots(numericValue);
    handleInputChange('price', numericOnly);
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Nama paket wajib diisi';
    }

    if (!formData.price || formData.price <= 0) {
      newErrors.price = 'Harga harus lebih dari 0';
    }

    if (!formData.duration_days || formData.duration_days <= 0) {
      newErrors.duration_days = 'Durasi harus lebih dari 0';
    }

    // Max branches and users validation removed - using high defaults for unlimited access

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      
      const submitData = {
        ...formData,
        price: parseFloat(formData.price),
        duration_days: parseInt(formData.duration_days),
        max_branches: parseInt(formData.max_branches),
        max_users: parseInt(formData.max_users),
        sort_order: parseInt(formData.sort_order)
      };

      if (isEditMode) {
        await subscriptionPlanService.updatePlan(id, submitData);
        alert('Paket langganan berhasil diperbarui!');
      } else {
        await subscriptionPlanService.createPlan(submitData);
        alert('Paket langganan berhasil dibuat!');
      }
      
      navigate('/subscription-plans');
    } catch (error) {
      console.error(`Error ${isEditMode ? 'updating' : 'creating'} subscription plan:`, error);
      alert(`Gagal ${isEditMode ? 'memperbarui' : 'membuat'} paket langganan`);
    } finally {
      setLoading(false);
    }
  };

  const getPlanIcon = (planName) => {
    const name = planName.toLowerCase();
    if (name.includes('basic')) return <FaStar className="text-yellow-500" />;
    if (name.includes('premium')) return <FaCrown className="text-purple-500" />;
    if (name.includes('enterprise')) return <FaGem className="text-blue-500" />;
    return <FaStar className="text-gray-500" />;
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount || 0);
  };

  const formatNumberWithDots = (value) => {
    if (!value) return '';
    const number = value.toString().replace(/\./g, '');
    return number.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  };

  const parseNumberFromDots = (value) => {
    if (!value) return '';
    return value.replace(/\./g, '');
  };

  if (loading && isEditMode) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center font-montserrat">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-500 mx-auto"></div>
          <p className="mt-6 text-gray-700 font-medium text-lg">Memuat data paket...</p>
          <p className="mt-2 text-gray-500 text-sm">Mohon tunggu sebentar</p>
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
            <button
              onClick={handleBackToPlans}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <FaArrowLeft className="text-gray-600 text-lg" />
            </button>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-500 rounded-lg">
                <FaCrown className="text-white text-xl" />
              </div>
              <div>
                <h1 className="text-lg font-semibold font-montserrat text-gray-900">
                  {isEditMode ? 'Edit Paket Langganan' : 'Tambah Paket Langganan'}
                </h1>
                <p className="text-sm text-gray-600 font-montserrat">
                  {isEditMode ? 'Edit paket langganan yang sudah ada' : 'Buat paket langganan baru untuk tenant'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 space-y-6 pb-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <FaInfoCircle className="text-indigo-500 text-lg" />
                <h2 className="text-xl font-montserrat text-gray-900">Informasi Dasar</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2 font-montserrat">
                    Nama Paket *
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Basic Plan, Premium Plan"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 text-sm ${
                      errors.name ? 'border-red-500' : 'border-gray-200'
                    }`}
                  />
                  {errors.name && <p className="text-red-500 text-xs mt-1 font-montserrat">{errors.name}</p>}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2 font-montserrat">
                    Urutan Tampil
                  </label>
                  <input
                    type="number"
                    placeholder="0"
                    value={formData.sort_order}
                    onChange={(e) => handleInputChange('sort_order', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 text-sm"
                  />
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2 font-montserrat">
                  Deskripsi
                </label>
                <textarea
                  placeholder="Deskripsi paket langganan..."
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 text-sm"
                />
              </div>
            </div>

            {/* Pricing & Duration */}
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <FaDollarSign className="text-green-500 text-lg" />
                <h2 className="text-xl font-montserrat text-gray-900">Harga & Durasi</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2 font-montserrat">
                    Harga (IDR) *
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="50.000"
                      value={displayPrice}
                      onChange={(e) => handlePriceChange(e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 text-sm ${
                        errors.price ? 'border-red-500' : 'border-gray-200'
                      }`}
                    />
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-gray-500 font-montserrat">
                      IDR
                    </div>
                  </div>
                  {errors.price && <p className="text-red-500 text-xs mt-1 font-montserrat">{errors.price}</p>}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2 font-montserrat">
                    Durasi (Hari) *
                  </label>
                  <input
                    type="number"
                    placeholder="30"
                    value={formData.duration_days}
                    onChange={(e) => handleInputChange('duration_days', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 text-sm ${
                      errors.duration_days ? 'border-red-500' : 'border-gray-200'
                    }`}
                  />
                  {errors.duration_days && <p className="text-red-500 text-xs mt-1 font-montserrat">{errors.duration_days}</p>}
                </div>
              </div>
            </div>

            {/* Limits */}
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <FaUsers className="text-blue-500 text-lg" />
                <h2 className="text-xl font-montserrat text-gray-900">Batas Paket</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2 font-montserrat">
                    Max Users
                  </label>
                  <input
                    type="number"
                    placeholder="5"
                    value={formData.max_users}
                    onChange={(e) => handleInputChange('max_users', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2 font-montserrat">
                    Max Branches
                  </label>
                  <input
                    type="number"
                    placeholder="1"
                    value={formData.max_branches}
                    onChange={(e) => handleInputChange('max_branches', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Features */}
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <FaCheckCircle className="text-green-500 text-lg" />
                <h2 className="text-xl font-montserrat text-gray-900">Fitur Paket</h2>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {Object.entries(formData.features).map(([key, value]) => (
                  <div key={key} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                    <input
                      type="checkbox"
                      id={key}
                      checked={value}
                      onChange={(e) => handleFeatureChange(key, e.target.checked)}
                      className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                    />
                    <label htmlFor={key} className="text-xs font-medium text-gray-700 font-montserrat capitalize">
                      {key.replace(/_/g, ' ')}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* Status */}
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <FaCheckCircle className="text-green-500 text-lg" />
                <h2 className="text-xl font-montserrat text-gray-900">Status Paket</h2>
              </div>
              
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => handleInputChange('is_active', e.target.checked)}
                  className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                />
                <label htmlFor="is_active" className="text-sm font-medium text-gray-700 font-montserrat">
                  Aktifkan paket ini
                </label>
              </div>
            </div>

            {/* Preview */}
            {formData.name && (
              <div className="bg-white rounded-xl p-4 shadow-sm border-2 border-indigo-200">
                <div className="flex items-center gap-2 mb-4">
                  <FaCrown className="text-indigo-500 text-lg" />
                  <h2 className="text-xl font-montserrat text-gray-900">Preview Paket</h2>
                </div>
                
                <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg p-4 border border-indigo-200">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-indigo-100 rounded-lg">
                      {getPlanIcon(formData.name)}
                    </div>
                    <div>
                      <h3 className="text-lg font-montserrat text-gray-900">{formData.name}</h3>
                      <p className="text-xs text-gray-500 font-montserrat">
                        {formData.description || 'Tidak ada deskripsi'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-500 font-semibold font-montserrat">Harga</p>
                      <p className="text-sm font-bold text-gray-900 font-montserrat">IDR {formatNumberWithDots(formData.price)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 font-semibold font-montserrat">Durasi</p>
                      <p className="text-sm font-bold text-gray-900 font-montserrat">{formData.duration_days} hari</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 font-semibold font-montserrat">Max Users</p>
                      <p className="text-sm font-bold text-gray-900 font-montserrat">{formData.max_users}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 font-semibold font-montserrat">Max Branches</p>
                      <p className="text-sm font-bold text-gray-900 font-montserrat">{formData.max_branches}</p>
                    </div>
                  </div>
                  
                  <div className="mt-3 pt-3 border-t border-indigo-200">
                    <div className="flex items-center gap-2 mb-2">
                      <FaCheckCircle className="text-green-500 text-sm" />
                      <p className="text-xs text-green-600 font-semibold font-montserrat">
                        {Object.values(formData.features).filter(f => f === true).length} fitur aktif
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {Object.entries(formData.features)
                        .filter(([_, enabled]) => enabled)
                        .slice(0, 3)
                        .map(([key, _]) => (
                          <span key={key} className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-montserrat">
                            {key.replace(/_/g, ' ')}
                          </span>
                        ))}
                      {Object.values(formData.features).filter(f => f === true).length > 3 && (
                        <span className="text-xs text-gray-500 font-montserrat">
                          +{Object.values(formData.features).filter(f => f === true).length - 3} lainnya
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-4">
              <AnimatedButton
                type="button"
                onClick={handleBackToPlans}
                variant="outline"
                className="flex-1 py-3 px-4 rounded-xl text-sm font-semibold flex items-center justify-center gap-2"
              >
                <FaTimes className="text-sm" />
                Batal
              </AnimatedButton>
              <AnimatedButton
                type="submit"
                variant="blue"
                className="flex-1 py-3 px-4 rounded-xl text-sm font-semibold flex items-center justify-center gap-2"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    {isEditMode ? 'Memperbarui...' : 'Menyimpan...'}
                  </>
                ) : (
                  <>
                    <FaSave className="text-sm" />
                    {isEditMode ? 'Perbarui Paket' : 'Simpan Paket'}
                  </>
                )}
              </AnimatedButton>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SuperAppCreateSubscriptionPlan;
