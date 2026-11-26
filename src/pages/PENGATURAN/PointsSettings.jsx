import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import HeaderBerandaOwner from '../../components/Com Header/HeaderBerandaOwner';
import AnimatedButton from '../../components/Design/AnimatedButton';
import instance from '../../config/api';
import { Coins, Info, AlertCircle, CheckCircle, RefreshCw, RotateCcw, Users, X, TrendingUp, Gift, Clock, Award } from 'lucide-react';
import CustomerMultiSelectModal from '../../components/Modal/CustomerMultiSelectModal';

const PointsSettings = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeMenu, setActiveMenu] = useState(1); // Menu utama: 1, 2, 3
  const [activeTab, setActiveTab] = useState('settings'); // Tab di dalam menu 1
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showEarnStudyCase, setShowEarnStudyCase] = useState(false);
  const [showRedeemStudyCase, setShowRedeemStudyCase] = useState(false);
  
  // Recalculate states
  const [recalculateScope, setRecalculateScope] = useState('all'); // 'all' or 'selected'
  const [recalculateCustomers, setRecalculateCustomers] = useState([]);
  const [showRecalculateModal, setShowRecalculateModal] = useState(false);
  const [recalculating, setRecalculating] = useState(false);
  const [recalculateResult, setRecalculateResult] = useState(null);
  const [showRecalculateWarningModal, setShowRecalculateWarningModal] = useState(false);
  
  // Reset states
  const [resetScope, setResetScope] = useState('all'); // 'all' or 'selected'
  const [resetCustomers, setResetCustomers] = useState([]);
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetOptions, setResetOptions] = useState({
    reset_points: true,
    reset_lifetime_points: false,
    reset_to_value: 0
  });
  const [resetting, setResetting] = useState(false);
  const [resetResult, setResetResult] = useState(null);
  const [resetConfirmText, setResetConfirmText] = useState('');
  const [showResetConfirmModal, setShowResetConfirmModal] = useState(false);

  // Default values
  const defaultConfig = {
    enabled: false,
    earn_rate: 1000,      // 1 poin per Rp 1.000
    redeem_rate: 50,      // 1 poin = Rp 50 (100 poin = Rp 5.000)
    min_redeem: 100,      // Minimum redeem
    recalculate_on_enable: false,
    referral_bonus_referrer: 10,      // Poin untuk referrer
    referral_bonus_new_customer: 10,   // Poin untuk customer baru yang direfer
    first_order_bonus: 10,             // Poin untuk customer baru yang order pertama tanpa referral
    first_order_bonus_enabled: true    // Enable/disable first order bonus
  };

  const [formData, setFormData] = useState(defaultConfig);

  useEffect(() => {
    fetchSettings();
  }, []);

  // Check if explanation modal should be shown on first visit

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await instance.get('/points-settings', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        const apiData = response.data.data;
        const settings = {
          enabled: apiData.enabled !== undefined ? Boolean(apiData.enabled) : defaultConfig.enabled,
          earn_rate: apiData.earn_rate !== undefined ? apiData.earn_rate : defaultConfig.earn_rate,
          redeem_rate: apiData.redeem_rate !== undefined ? apiData.redeem_rate : defaultConfig.redeem_rate,
          min_redeem: apiData.min_redeem !== undefined ? apiData.min_redeem : defaultConfig.min_redeem,
          recalculate_on_enable: apiData.recalculate_on_enable !== undefined ? Boolean(apiData.recalculate_on_enable) : defaultConfig.recalculate_on_enable,
          referral_bonus_referrer: apiData.referral_bonus_referrer !== undefined ? apiData.referral_bonus_referrer : defaultConfig.referral_bonus_referrer,
          referral_bonus_new_customer: apiData.referral_bonus_new_customer !== undefined ? apiData.referral_bonus_new_customer : defaultConfig.referral_bonus_new_customer,
          first_order_bonus: apiData.first_order_bonus !== undefined ? apiData.first_order_bonus : (apiData.referral_bonus_new_customer !== undefined ? apiData.referral_bonus_new_customer : defaultConfig.first_order_bonus), // Backward compatibility
          first_order_bonus_enabled: apiData.first_order_bonus_enabled !== undefined ? Boolean(apiData.first_order_bonus_enabled) : defaultConfig.first_order_bonus_enabled
        };
        
        setFormData(settings);
      }
    } catch (error) {
      console.error('Error fetching points settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setSaveSuccess(false);
      const token = localStorage.getItem('token');
      
      const payload = {
        enabled: formData.enabled,
        earn_rate: parseInt(formData.earn_rate) || defaultConfig.earn_rate,
        redeem_rate: parseInt(formData.redeem_rate) || defaultConfig.redeem_rate,
        min_redeem: parseInt(formData.min_redeem) || defaultConfig.min_redeem,
        recalculate_on_enable: formData.recalculate_on_enable,
        referral_bonus_referrer: parseInt(formData.referral_bonus_referrer) !== undefined && !isNaN(parseInt(formData.referral_bonus_referrer)) ? parseInt(formData.referral_bonus_referrer) : defaultConfig.referral_bonus_referrer,
        referral_bonus_new_customer: parseInt(formData.referral_bonus_new_customer) !== undefined && !isNaN(parseInt(formData.referral_bonus_new_customer)) ? parseInt(formData.referral_bonus_new_customer) : defaultConfig.referral_bonus_new_customer,
        first_order_bonus: parseInt(formData.first_order_bonus) !== undefined && !isNaN(parseInt(formData.first_order_bonus)) ? parseInt(formData.first_order_bonus) : defaultConfig.first_order_bonus,
        first_order_bonus_enabled: formData.first_order_bonus_enabled
      };

      const response = await instance.put('/points-settings', payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (error) {
      console.error('Error saving points settings:', error);
      alert('Gagal menyimpan pengaturan: ' + (error.response?.data?.message || error.message));
    } finally {
      setSaving(false);
    }
  };

  // Calculate examples for preview
  const calculateEarnExample = (amount) => {
    return Math.floor(amount / formData.earn_rate);
  };

  const calculateRedeemExample = (points) => {
    return Math.floor((points / 100) * (formData.redeem_rate * 100));
  };

  // Store customers for display
  const [customers, setCustomers] = useState([]);

  const fetchCustomerDetails = async (customerIds) => {
    try {
      const token = localStorage.getItem('token');
      // Fetch all customers and filter by selected IDs
      const { data } = await instance.get('/customers', {
        params: { limit: 1000 }, // Get many customers
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (data.success) {
        const allCustomers = data.data.customers || [];
        const selectedCustomers = allCustomers.filter(c => customerIds.includes(c.id));
        setCustomers(selectedCustomers);
      }
    } catch (error) {
      console.error('Error fetching customer details:', error);
      // If error, just use empty array - customer names will be shown as IDs
      setCustomers([]);
    }
  };

  const handleRecalculateClick = () => {
    // Show warning modal first
    setShowRecalculateWarningModal(true);
  };

  const handleRecalculate = async () => {
    // Close warning modal
    setShowRecalculateWarningModal(false);
    
    try {
      setRecalculating(true);
      setRecalculateResult(null);
      const token = localStorage.getItem('token');
      
      const payload = {
        customer_ids: recalculateScope === 'all' ? [] : recalculateCustomers
      };

      const response = await instance.post('/points-management/recalculate', payload, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 300000 // 5 minutes timeout for recalculate (handles large number of customers)
      });

      if (response.data.success) {
        setRecalculateResult(response.data.data);
        // Reset selection after success
        if (recalculateScope === 'selected') {
          setRecalculateCustomers([]);
          setCustomers([]);
        }
      } else {
        setRecalculateResult({
          success: false,
          message: response.data.message || 'Gagal menghitung ulang poin'
        });
      }
    } catch (error) {
      console.error('Error recalculating points:', error);
      setRecalculateResult({
        success: false,
        message: error.response?.data?.message || error.message || 'Terjadi kesalahan saat menghitung ulang poin'
      });
    } finally {
      setRecalculating(false);
    }
  };

  const handleReset = async () => {
    try {
      setResetting(true);
      setResetResult(null);
      setShowResetConfirmModal(false);
      setResetConfirmText('');
      const token = localStorage.getItem('token');
      
      const payload = {
        customer_ids: resetScope === 'all' ? [] : resetCustomers,
        reset_points: resetOptions.reset_points,
        reset_lifetime_points: resetOptions.reset_lifetime_points,
        reset_to_value: resetOptions.reset_to_value
      };

      const response = await instance.post('/points-management/reset', payload, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 300000 // 5 minutes timeout for reset (handles large number of customers)
      });

      if (response.data.success) {
        setResetResult(response.data.data);
        // Reset selection after success
        if (resetScope === 'selected') {
          setResetCustomers([]);
          setCustomers([]);
        }
      } else {
        setResetResult({
          success: false,
          message: response.data.message || 'Gagal mereset poin'
        });
      }
    } catch (error) {
      console.error('Error resetting points:', error);
      setResetResult({
        success: false,
        message: error.response?.data?.message || error.message || 'Terjadi kesalahan saat mereset poin'
      });
    } finally {
      setResetting(false);
    }
  };

  if (loading) {
    return (
      <div className="h-[100dvh] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600 font-montserrat">Memuat pengaturan...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[100dvh] flex flex-col overflow-hidden font-montserrat bg-gray-50">
      <HeaderBerandaOwner 
        title="Pengaturan Sistem Poin"
        description="Atur konversi poin"
        showBackButton={true}
        backPath="/berandaowner"
        currentTime={new Date().toLocaleTimeString()}
      />
      
      {/* Main Menu Navigation */}
      <div className="bg-white border-b border-gray-200 px-6">
        <div className="flex gap-4">
          <button
            onClick={() => setActiveMenu(1)}
            className={`px-6 py-3 font-semibold text-sm transition-colors border-b-2 ${
              activeMenu === 1
                ? 'border-orange-500 text-orange-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Menu 1
          </button>
          <button
            onClick={() => setActiveMenu(2)}
            className={`px-6 py-3 font-semibold text-sm transition-colors border-b-2 ${
              activeMenu === 2
                ? 'border-orange-500 text-orange-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Menu 2
          </button>
          <button
            onClick={() => setActiveMenu(3)}
            className={`px-6 py-3 font-semibold text-sm transition-colors border-b-2 ${
              activeMenu === 3
                ? 'border-orange-500 text-orange-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Menu 3
          </button>
        </div>
      </div>

      {/* Menu 1 Content - Tab Navigation */}
      {activeMenu === 1 && (
        <div className="bg-white border-b border-gray-200 px-6 pt-6">
          <div className="flex gap-4">
            <button
              onClick={() => setActiveTab('settings')}
              className={`px-4 py-3 font-semibold text-sm transition-colors border-b-2 ${
                activeTab === 'settings'
                  ? 'border-orange-500 text-orange-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Pengaturan
            </button>
            <button
              onClick={() => setActiveTab('recalculate')}
              className={`px-4 py-3 font-semibold text-sm transition-colors border-b-2 ${
                activeTab === 'recalculate'
                  ? 'border-orange-500 text-orange-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Hitung Poin Ulang
            </button>
            <button
              onClick={() => setActiveTab('reset')}
              className={`px-4 py-3 font-semibold text-sm transition-colors border-b-2 ${
                activeTab === 'reset'
                  ? 'border-orange-500 text-orange-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Reset Poin
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className={`flex-1 overflow-y-auto ${(recalculating || resetting) ? 'pointer-events-none opacity-50' : ''}`}>
        <div className="mx-auto px-4 md:px-10 pt-6 pb-6 max-w-4xl">
          {/* Menu 1 Content */}
          {activeMenu === 1 && activeTab === 'settings' && (
            <div className="space-y-6">
              {/* Enable/Disable Toggle */}
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-900 font-montserrat mb-2 flex items-center gap-2">
                      <Coins className="w-5 h-5 text-amber-600" />
                      Aktifkan Sistem Poin
                    </h3>
                    <p className="text-sm text-gray-600 font-montserrat">
                      Aktifkan atau nonaktifkan sistem poin untuk semua customer. Jika dinonaktifkan, customer tidak akan mendapatkan poin dari transaksi.
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer ml-4">
                    <input
                      type="checkbox"
                      checked={formData.enabled}
                      onChange={(e) => handleInputChange('enabled', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-14 h-7 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-orange-500"></div>
                  </label>
                </div>
                {formData.enabled && (
                  <div className="mt-4 bg-green-50 rounded-lg p-3 border border-green-200">
                    <p className="text-sm text-green-700 font-montserrat flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" />
                      Sistem poin aktif. Customer akan mendapatkan poin dari transaksi yang sudah lunas.
                    </p>
                  </div>
                )}
                {!formData.enabled && (
                  <div className="mt-4 bg-gray-50 rounded-lg p-3 border border-gray-200">
                    <p className="text-sm text-gray-600 font-montserrat flex items-center gap-2">
                      <AlertCircle className="w-4 h-4" />
                      Sistem poin nonaktif. Customer tidak akan mendapatkan poin dari transaksi.
                    </p>
                  </div>
                )}
                {/* Button untuk membuka modal panduan */}
                <div className="mt-4 pt-4 border-t border-gray-200">
                </div>
              </div>

              {/* Points Configuration - Only show when enabled */}
              {formData.enabled && (
                <>
              {/* Points Configuration */}
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                    <h3 className="font-bold text-gray-900 font-montserrat mb-4 flex items-center gap-2">
                      <Info className="w-5 h-5 text-blue-600" />
                      Konversi Poin
                    </h3>
                    
                    <div className="space-y-4">
                      {/* Earn Rate */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 font-montserrat mb-2">
                          Earn Rate (Poin dari Pembayaran)
                        </label>
                        <div className="flex items-center gap-2 sm:gap-3">
                          <span className="text-xs sm:text-sm text-gray-600 font-montserrat whitespace-nowrap">1 poin = Rp</span>
                          <input
                            type="number"
                            min="1"
                            value={formData.earn_rate}
                            onChange={(e) => handleInputChange('earn_rate', e.target.value)}
                            className="w-24 sm:w-28 px-2 sm:px-3 py-1.5 sm:py-2 border border-gray-300 rounded-lg text-sm font-montserrat focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                            placeholder="1000"
                          />
                          <span className="text-xs sm:text-sm text-gray-600 font-montserrat">dari total pembayaran</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setShowEarnStudyCase(!showEarnStudyCase)}
                          className="mt-1 text-xs text-blue-600 hover:text-blue-700 font-montserrat underline"
                        >
                          {showEarnStudyCase ? 'Sembunyikan penjelasan' : 'Penjelasan'}
                        </button>
                        {showEarnStudyCase && (
                          <div className="mt-2 bg-blue-50 rounded-lg p-3 border border-blue-200">
                            <p className="text-xs font-semibold text-gray-700 font-montserrat mb-1">Study Case:</p>
                            <div className="space-y-1">
                              <p className="text-xs text-gray-600 font-montserrat">• Total pesanan: Rp 50.000</p>
                              <p className="text-xs text-gray-600 font-montserrat">• Konversi: Rp 50.000 ÷ Rp {formData.earn_rate?.toLocaleString('id-ID')} = {calculateEarnExample(50000)} poin</p>
                              <p className="text-xs font-semibold text-blue-700 font-montserrat">• Customer akan dapat: {calculateEarnExample(50000)} poin</p>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Redeem Rate */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 font-montserrat mb-2">
                          Redeem Rate (Poin untuk Diskon)
                        </label>
                        <div className="flex items-center gap-2 sm:gap-3">
                          <span className="text-xs sm:text-sm text-gray-600 font-montserrat whitespace-nowrap">100 poin = Rp</span>
                          <input
                            type="number"
                            min="1"
                            value={formData.redeem_rate * 100}
                            onChange={(e) => {
                              const value = parseInt(e.target.value) || 0;
                              handleInputChange('redeem_rate', value / 100);
                            }}
                            className="w-24 sm:w-28 px-2 sm:px-3 py-1.5 sm:py-2 border border-gray-300 rounded-lg text-sm font-montserrat focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                            placeholder="5000"
                          />
                          <span className="text-xs sm:text-sm text-gray-600 font-montserrat">diskon (1 poin = Rp {formData.redeem_rate})</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setShowRedeemStudyCase(!showRedeemStudyCase)}
                          className="mt-1 text-xs text-blue-600 hover:text-blue-700 font-montserrat underline"
                        >
                          {showRedeemStudyCase ? 'Sembunyikan penjelasan' : 'Penjelasan'}
                        </button>
                        {showRedeemStudyCase && (
                          <div className="mt-2 bg-orange-50 rounded-lg p-3 border border-orange-200">
                            <p className="text-xs font-semibold text-gray-700 font-montserrat mb-1">Study Case:</p>
                            <div className="space-y-1">
                              <p className="text-xs text-gray-600 font-montserrat">• Customer punya: 200 poin</p>
                              <p className="text-xs text-gray-600 font-montserrat">• Konversi: 200 poin ÷ 100 × Rp {(formData.redeem_rate * 100)?.toLocaleString('id-ID')} = Rp {calculateRedeemExample(200)?.toLocaleString('id-ID')} diskon</p>
                              <p className="text-xs font-semibold text-orange-700 font-montserrat">• Customer akan dapat diskon: Rp {calculateRedeemExample(200)?.toLocaleString('id-ID')}</p>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Min Redeem */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 font-montserrat mb-2">
                          Minimum Redeem
                        </label>
                        <div className="flex items-center gap-2 sm:gap-3">
                          <input
                            type="number"
                            min="1"
                            value={formData.min_redeem}
                            onChange={(e) => handleInputChange('min_redeem', e.target.value)}
                            className="w-24 sm:w-32 px-2 sm:px-3 py-1.5 sm:py-2 border border-gray-300 rounded-lg text-sm font-montserrat focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                            placeholder="100"
                          />
                          <span className="text-xs sm:text-sm text-gray-600 font-montserrat">poin</span>
                        </div>
                        <p className="text-xs text-gray-500 font-montserrat mt-1">
                          Minimum poin yang bisa digunakan untuk diskon
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Referral Bonus Configuration */}
                  <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                    <h3 className="font-bold text-gray-900 font-montserrat mb-4 flex items-center gap-2">
                      <Users className="w-5 h-5 text-purple-600" />
                      Bonus Poin Referral
                    </h3>
                    
                    <div className="space-y-4">
                      {/* Referrer Bonus */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 font-montserrat mb-2">
                          Poin untuk Referrer
                        </label>
                        <div className="flex items-center gap-2 sm:gap-3">
                          <input
                            type="number"
                            min="0"
                            value={formData.referral_bonus_referrer}
                            onChange={(e) => handleInputChange('referral_bonus_referrer', e.target.value)}
                            className="w-24 sm:w-32 px-2 sm:px-3 py-1.5 sm:py-2 border border-gray-300 rounded-lg text-sm font-montserrat focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                            placeholder="10"
                          />
                          <span className="text-xs sm:text-sm text-gray-600 font-montserrat">poin</span>
                        </div>
                        <p className="text-xs text-gray-500 font-montserrat mt-1">
                          Poin yang diberikan kepada customer yang berhasil merefer customer lain (diberikan saat customer baru membuat order pertama)
                        </p>
                      </div>

                      {/* New Customer Bonus */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 font-montserrat mb-2">
                          Poin untuk Customer Baru
                        </label>
                        <div className="flex items-center gap-2 sm:gap-3">
                          <input
                            type="number"
                            min="0"
                            value={formData.referral_bonus_new_customer}
                            onChange={(e) => handleInputChange('referral_bonus_new_customer', e.target.value)}
                            className="w-24 sm:w-32 px-2 sm:px-3 py-1.5 sm:py-2 border border-gray-300 rounded-lg text-sm font-montserrat focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                            placeholder="10"
                          />
                          <span className="text-xs sm:text-sm text-gray-600 font-montserrat">poin</span>
                        </div>
                        <p className="text-xs text-gray-500 font-montserrat mt-1">
                          Poin yang diberikan kepada customer baru yang direfer saat melakukan order pertama. Set 0 untuk menonaktifkan bonus ini.
                        </p>
                      </div>

                      {/* First Order Bonus Enabled Toggle */}
                      <div>
                        <div className="flex items-center justify-between mb-2 mt-10">
                          <label className="block text-sm font-semibold text-gray-700 font-montserrat">
                            Aktifkan Bonus Order Pertama
                          </label>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={formData.first_order_bonus_enabled}
                              onChange={(e) => handleInputChange('first_order_bonus_enabled', e.target.checked)}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                          </label>
                        </div>
                        <p className="text-xs text-gray-500 font-montserrat">
                          Aktifkan bonus untuk customer baru yang melakukan order pertama tanpa referral. Jika dinonaktifkan, customer baru tanpa referral tidak akan mendapat bonus.
                        </p>
                      </div>

                      {/* First Order Bonus */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 font-montserrat mb-2">
                          Poin untuk Order Pertama (Tanpa Referral)
                        </label>
                        <div className="flex items-center gap-2 sm:gap-3">
                          <input
                            type="number"
                            min="0"
                            value={formData.first_order_bonus}
                            onChange={(e) => handleInputChange('first_order_bonus', e.target.value)}
                            className="w-24 sm:w-32 px-2 sm:px-3 py-1.5 sm:py-2 border border-gray-300 rounded-lg text-sm font-montserrat focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                            placeholder="10"
                            disabled={!formData.first_order_bonus_enabled}
                          />
                          <span className="text-xs sm:text-sm text-gray-600 font-montserrat">poin</span>
                        </div>
                        <p className="text-xs text-gray-500 font-montserrat mt-1">
                          Poin yang diberikan kepada customer baru yang melakukan order pertama tanpa referral. Hanya berlaku jika "Aktifkan Bonus Order Pertama" diaktifkan.
                        </p>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* Save Button */}
              <div className="flex justify-end gap-3">
                <AnimatedButton
                  onClick={() => navigate('/berandaowner')}
                  className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl font-semibold font-montserrat hover:bg-gray-300 transition-colors"
                >
                  Batal
                </AnimatedButton>
                <AnimatedButton
                  onClick={handleSave}
                  disabled={saving}
                  className="px-6 py-3 bg-orange-500 text-white rounded-xl font-semibold font-montserrat hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Menyimpan...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      Simpan Pengaturan
                    </>
                  )}
                </AnimatedButton>
              </div>

              {saveSuccess && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <p className="text-sm text-green-800 font-montserrat">Pengaturan berhasil disimpan!</p>
                </div>
              )}
            </div>
          )}

          {activeMenu === 1 && activeTab === 'recalculate' && (
            <div className="space-y-6">
              {!formData.enabled ? (
                <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-200 text-center">
                  <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="font-bold text-gray-900 font-montserrat text-lg mb-2">
                    Sistem Poin Belum Diaktifkan
                  </h3>
                  <p className="text-sm text-gray-600 font-montserrat mb-4">
                    Aktifkan terlebih dahulu sistem poin di tab <strong>Pengaturan</strong> untuk menggunakan fitur ini.
                  </p>
                  <AnimatedButton
                    onClick={() => setActiveTab('settings')}
                    className="px-6 py-3 bg-orange-500 text-white rounded-xl font-semibold font-montserrat hover:bg-orange-600 transition-colors"
                  >
                    Buka Pengaturan
                  </AnimatedButton>
                </div>
              ) : (
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <h3 className="font-bold text-gray-900 font-montserrat mb-4 flex items-center gap-2">
                  <RefreshCw className="w-5 h-5 text-blue-600" />
                  Hitung Poin Ulang
                </h3>
                <p className="text-sm text-gray-600 font-montserrat mb-6">
                    Hitung ulang poin customer berdasarkan semua transaksi yang sudah lunas menggunakan aturan konversi poin saat ini. 
                    <strong className="text-orange-600"> Semua poin dan riwayat poin akan dihapus terlebih dahulu, kemudian sistem akan menghitung ulang dari awal berdasarkan transaksi yang sudah dibayar.</strong>
                </p>

                {/* Scope Selection */}
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-gray-700 font-montserrat mb-3">
                    Pilih Scope
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="radio"
                        name="recalculate_scope"
                        value="all"
                        checked={recalculateScope === 'all'}
                        onChange={(e) => setRecalculateScope(e.target.value)}
                        className="w-4 h-4 text-orange-600 border-gray-300 focus:ring-orange-500"
                      />
                      <span className="text-sm text-gray-700 font-montserrat">Semua Customer</span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="radio"
                        name="recalculate_scope"
                        value="selected"
                        checked={recalculateScope === 'selected'}
                        onChange={(e) => setRecalculateScope(e.target.value)}
                        className="w-4 h-4 text-orange-600 border-gray-300 focus:ring-orange-500"
                      />
                      <span className="text-sm text-gray-700 font-montserrat">Customer Tertentu</span>
                    </label>
                  </div>
                </div>

                {/* Customer Selection */}
                {recalculateScope === 'selected' && (
                  <div className="mb-6">
                    <button
                      onClick={() => setShowRecalculateModal(true)}
                      className="w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-orange-500 hover:text-orange-600 transition-colors font-montserrat flex items-center justify-center gap-2"
                    >
                      <Users className="w-5 h-5" />
                      {recalculateCustomers.length > 0
                        ? `${recalculateCustomers.length} customer dipilih`
                        : 'Pilih Customer'}
                    </button>
                    {recalculateCustomers.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {recalculateCustomers.map(customerId => {
                          const customer = customers.find(c => c.id === customerId);
                          return customer ? (
                            <span
                              key={customerId}
                              className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-montserrat flex items-center gap-2"
                            >
                              {customer.name}
                              <button
                                onClick={() => setRecalculateCustomers(prev => prev.filter(id => id !== customerId))}
                                className="hover:text-orange-900"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </span>
                          ) : null;
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* Info */}
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200 mb-6">
                  <div className="flex items-start gap-3">
                    <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm text-blue-800 font-montserrat">
                        Sistem akan menghapus semua poin dan riwayat poin customer yang dipilih, kemudian menghitung ulang poin dari semua transaksi yang sudah lunas.
                        <br />
                        <strong>Konversi poin saat ini:</strong> Setiap pembelian Rp {formData.earn_rate?.toLocaleString('id-ID')} akan mendapat 1 poin.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Action Button */}
                <AnimatedButton
                  onClick={handleRecalculateClick}
                  disabled={recalculating || (recalculateScope === 'selected' && recalculateCustomers.length === 0)}
                  className="w-full px-6 py-3 bg-blue-500 text-white rounded-xl font-semibold font-montserrat hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {recalculating ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Menghitung ulang...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4" />
                      Hitung Ulang Poin
                    </>
                  )}
                </AnimatedButton>

                {/* Result */}
                {recalculateResult && (
                  <div className={`mt-4 rounded-lg p-4 border ${
                    recalculateResult.success
                      ? 'bg-green-50 border-green-200'
                      : 'bg-red-50 border-red-200'
                  }`}>
                    <div className="flex items-start gap-3">
                      {recalculateResult.success ? (
                        <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                      )}
                      <div className="flex-1">
                        <p className={`text-sm font-semibold font-montserrat mb-1 ${
                          recalculateResult.success ? 'text-green-800' : 'text-red-800'
                        }`}>
                          {recalculateResult.success ? 'Berhasil!' : 'Gagal'}
                        </p>
                        {recalculateResult.success && (
                          <div className="text-sm text-green-700 font-montserrat space-y-1">
                            <p>• Total customer: {recalculateResult.total_customers}</p>
                            <p>• Customer di-recalculate: {recalculateResult.total_recalculated}</p>
                            <p>• Total poin ditambahkan: {recalculateResult.total_points_added > 0 ? '+' : ''}{recalculateResult.total_points_added}</p>
                          </div>
                        )}
                        {!recalculateResult.success && (
                          <p className="text-sm text-red-700 font-montserrat">
                            {recalculateResult.message || 'Terjadi kesalahan saat menghitung ulang poin'}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
                )}
            </div>
          )}

          {activeMenu === 1 && activeTab === 'reset' && (
            <div className="space-y-6">
              {!formData.enabled ? (
                <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-200 text-center">
                  <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="font-bold text-gray-900 font-montserrat text-lg mb-2">
                    Sistem Poin Belum Diaktifkan
                  </h3>
                  <p className="text-sm text-gray-600 font-montserrat mb-4">
                    Aktifkan terlebih dahulu sistem poin di tab <strong>Pengaturan</strong> untuk menggunakan fitur ini.
                  </p>
                  <AnimatedButton
                    onClick={() => setActiveTab('settings')}
                    className="px-6 py-3 bg-orange-500 text-white rounded-xl font-semibold font-montserrat hover:bg-orange-600 transition-colors"
                  >
                    Buka Pengaturan
                  </AnimatedButton>
                </div>
              ) : (
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <h3 className="font-bold text-gray-900 font-montserrat mb-4 flex items-center gap-2">
                  <RotateCcw className="w-5 h-5 text-red-600" />
                  Reset Poin Customer
                </h3>
                <p className="text-sm text-gray-600 font-montserrat mb-6">
                    Reset poin customer ke nilai tertentu. <strong className="text-red-600">Semua poin dan riwayat poin akan dihapus, kemudian poin akan diatur ke nilai yang Anda tentukan.</strong> Aksi ini tidak dapat dibatalkan.
                </p>

                {/* Scope Selection */}
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-gray-700 font-montserrat mb-3">
                    Pilih Scope
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="radio"
                        name="reset_scope"
                        value="all"
                        checked={resetScope === 'all'}
                        onChange={(e) => setResetScope(e.target.value)}
                        className="w-4 h-4 text-orange-600 border-gray-300 focus:ring-orange-500"
                      />
                      <span className="text-sm text-gray-700 font-montserrat">Semua Customer</span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="radio"
                        name="reset_scope"
                        value="selected"
                        checked={resetScope === 'selected'}
                        onChange={(e) => setResetScope(e.target.value)}
                        className="w-4 h-4 text-orange-600 border-gray-300 focus:ring-orange-500"
                      />
                      <span className="text-sm text-gray-700 font-montserrat">Customer Tertentu</span>
                    </label>
                  </div>
                </div>

                {/* Customer Selection */}
                {resetScope === 'selected' && (
                  <div className="mb-6">
                    <button
                      onClick={() => setShowResetModal(true)}
                      className="w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-orange-500 hover:text-orange-600 transition-colors font-montserrat flex items-center justify-center gap-2"
                    >
                      <Users className="w-5 h-5" />
                      {resetCustomers.length > 0
                        ? `${resetCustomers.length} customer dipilih`
                        : 'Pilih Customer'}
                    </button>
                    {resetCustomers.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {resetCustomers.map(customerId => {
                          const customer = customers.find(c => c.id === customerId);
                          return customer ? (
                            <span
                              key={customerId}
                              className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-montserrat flex items-center gap-2"
                            >
                              {customer.name}
                              <button
                                onClick={() => setResetCustomers(prev => prev.filter(id => id !== customerId))}
                                className="hover:text-red-900"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </span>
                          ) : null;
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* Reset Options */}
                <div className="mb-6 space-y-4">
                  <div>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={resetOptions.reset_points}
                        onChange={(e) => setResetOptions(prev => ({ ...prev, reset_points: e.target.checked }))}
                        className="w-5 h-5 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                      />
                      <span className="text-sm font-semibold text-gray-700 font-montserrat">Reset points</span>
                    </label>
                  </div>
                  <div>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={resetOptions.reset_lifetime_points}
                        onChange={(e) => setResetOptions(prev => ({ ...prev, reset_lifetime_points: e.target.checked }))}
                        className="w-5 h-5 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                      />
                      <span className="text-sm font-semibold text-gray-700 font-montserrat">Reset lifetime points juga</span>
                    </label>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 font-montserrat mb-2">
                      Reset ke nilai
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={resetOptions.reset_to_value}
                      onChange={(e) => setResetOptions(prev => ({ ...prev, reset_to_value: parseInt(e.target.value) || 0 }))}
                      className="w-32 px-3 py-2 border border-gray-300 rounded-lg text-sm font-montserrat focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    />
                  </div>
                </div>

                {/* Warning */}
                <div className="bg-red-50 rounded-lg p-4 border border-red-200 mb-6">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-red-800 font-montserrat mb-1">
                        Peringatan: Aksi ini tidak dapat dibatalkan!
                      </p>
                      <p className="text-sm text-red-700 font-montserrat">
                        Poin customer akan direset ke nilai yang ditentukan. Pastikan Anda yakin sebelum melanjutkan.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Action Button */}
                <AnimatedButton
                  onClick={() => setShowResetConfirmModal(true)}
                  disabled={resetting || (resetScope === 'selected' && resetCustomers.length === 0) || (!resetOptions.reset_points && !resetOptions.reset_lifetime_points)}
                  className="w-full px-6 py-3 bg-red-500 text-white rounded-xl font-semibold font-montserrat hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {resetting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Mereset poin...
                    </>
                  ) : (
                    <>
                      <RotateCcw className="w-4 h-4" />
                      Reset Poin
                    </>
                  )}
                </AnimatedButton>

                {/* Result */}
                {resetResult && (
                  <div className={`mt-4 rounded-lg p-4 border ${
                    resetResult.success
                      ? 'bg-green-50 border-green-200'
                      : 'bg-red-50 border-red-200'
                  }`}>
                    <div className="flex items-start gap-3">
                      {resetResult.success ? (
                        <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                      )}
                      <div className="flex-1">
                        <p className={`text-sm font-semibold font-montserrat mb-1 ${
                          resetResult.success ? 'text-green-800' : 'text-red-800'
                        }`}>
                          {resetResult.success ? 'Berhasil!' : 'Gagal'}
                        </p>
                        {resetResult.success && (
                          <div className="text-sm text-green-700 font-montserrat space-y-1">
                            <p>• Total customer: {resetResult.total_customers}</p>
                            <p>• Customer di-reset: {resetResult.total_reset}</p>
                          </div>
                        )}
                        {!resetResult.success && (
                          <p className="text-sm text-red-700 font-montserrat">
                            {resetResult.message || 'Terjadi kesalahan saat mereset poin'}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
                )}
            </div>
          )}

          {/* Menu 1 - Guide Tab */}
          {activeMenu === 1 && activeTab === 'guide' && (
            <div className="space-y-5">
              {/* Cara Mendapatkan Poin */}
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <h3 className="font-bold text-gray-900 font-montserrat text-base mb-3 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-blue-600" />
                  Cara Mendapatkan Poin
                </h3>
                
                <div className="space-y-3">
                  {/* Earning dari Order */}
                  <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                    <h4 className="font-semibold text-gray-900 text-sm font-montserrat mb-2">
                      Poin dari Order yang Lunas
                    </h4>
                    <p className="text-sm text-gray-700 font-montserrat leading-relaxed mb-2">
                      Setiap order yang sudah lunas (status: paid) akan memberikan poin berdasarkan total pembayaran.
                    </p>
                    <div className="bg-white rounded-lg p-3 border border-blue-100">
                      <p className="text-xs text-gray-600 font-montserrat">
                        <strong>Konversi:</strong> 1 poin = Rp {formData.earn_rate?.toLocaleString('id-ID')} dari total pembayaran
                      </p>
                      <p className="text-xs text-gray-600 font-montserrat mt-1">
                        <strong>Contoh:</strong> Order Rp 50.000 yang sudah lunas = {Math.floor(50000 / formData.earn_rate)} poin (Rp 50.000 ÷ Rp {formData.earn_rate?.toLocaleString('id-ID')})
                      </p>
                    </div>
                  </div>

                  {/* Bonus Order Pertama */}
                  {formData.first_order_bonus_enabled && formData.first_order_bonus > 0 && (
                    <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                      <h4 className="font-semibold text-gray-900 text-sm font-montserrat mb-2">
                        Bonus Order Pertama
                      </h4>
                      <p className="text-sm text-gray-700 font-montserrat leading-relaxed mb-2">
                        Customer baru yang melakukan order pertama dan sudah lunas akan mendapatkan bonus poin.
                      </p>
                      <div className="bg-white rounded-lg p-3 border border-green-100">
                        <p className="text-xs text-gray-600 font-montserrat">
                          <strong>Bonus:</strong> +{formData.first_order_bonus} poin (sekali seumur hidup, hanya saat order pertama lunas)
                        </p>
                        <p className="text-xs text-gray-600 font-montserrat mt-1">
                          <strong>Contoh:</strong> Order pertama Rp 30.000 lunas = {Math.floor(30000 / formData.earn_rate)} poin (dari order) + {formData.first_order_bonus} poin (bonus) = {Math.floor(30000 / formData.earn_rate) + formData.first_order_bonus} poin total
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Bonus Referral */}
                  <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                    <h4 className="font-semibold text-gray-900 text-sm font-montserrat mb-2">
                      Bonus Referral
                    </h4>
                    <p className="text-sm text-gray-700 font-montserrat leading-relaxed mb-2">
                      Jika customer baru menggunakan kode referral saat order pertama, baik referrer maupun customer baru akan mendapatkan bonus.
                    </p>
                    <div className="bg-white rounded-lg p-3 border border-purple-100">
                      <p className="text-xs text-gray-600 font-montserrat">
                        <strong>Bonus untuk Referrer:</strong> +{formData.referral_bonus_referrer} poin (langsung saat order dibuat)
                      </p>
                      <p className="text-xs text-gray-600 font-montserrat mt-1">
                        <strong>Bonus untuk Customer Baru:</strong> +{formData.referral_bonus_new_customer} poin (langsung saat order dibuat)
                      </p>
                      <p className="text-xs text-gray-600 font-montserrat mt-1">
                        <strong>Contoh:</strong> Customer A refer Customer B. Saat B order pertama (belum lunas), A dapat +{formData.referral_bonus_referrer} poin, B dapat +{formData.referral_bonus_new_customer} poin. Saat B lunas, B dapat poin dari order + bonus order pertama.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Cara Menggunakan Poin */}
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <h3 className="font-bold text-gray-900 font-montserrat text-base mb-3 flex items-center gap-2">
                  <Coins className="w-5 h-5 text-orange-600" />
                  Cara Menggunakan Poin
                </h3>
                
                <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
                  <h4 className="font-semibold text-gray-900 text-sm font-montserrat mb-2">
                    Redeem Poin untuk Diskon
                  </h4>
                  <p className="text-sm text-gray-700 font-montserrat leading-relaxed mb-3">
                    Poin bisa digunakan untuk mendapatkan diskon saat checkout. Poin bisa dikombinasikan dengan diskon membership atau promo lainnya.
                  </p>
                  
                  <div className="bg-white rounded-lg p-3 border border-orange-100 space-y-2">
                    <p className="text-xs text-gray-600 font-montserrat">
                      <strong>Konversi:</strong> 100 poin = Rp {(formData.redeem_rate * 100)?.toLocaleString('id-ID')} diskon (1 poin = Rp {formData.redeem_rate?.toLocaleString('id-ID')})
                    </p>
                    <p className="text-xs text-gray-600 font-montserrat">
                      <strong>Minimum:</strong> {formData.min_redeem} poin (bisa pakai berapa saja asal minimal {formData.min_redeem}, tidak harus kelipatan {formData.min_redeem})
                    </p>
                    <p className="text-xs text-gray-600 font-montserrat">
                      <strong>Maksimal:</strong> Sesuai total pesanan (tidak bisa melebihi total)
                    </p>
                  </div>

                  <div className="bg-white rounded-lg p-3 border border-orange-100 mt-3">
                    <p className="text-xs font-semibold text-gray-700 font-montserrat mb-2">
                      Study Case:
                    </p>
                    <p className="text-xs text-gray-600 font-montserrat mb-1">
                      • Total pesanan: Rp 40.000
                    </p>
                    <p className="text-xs text-gray-600 font-montserrat mb-1">
                      • Customer punya: 500 poin terkumpul
                    </p>
                    <p className="text-xs text-gray-600 font-montserrat mb-1">
                      • Maksimal poin yang bisa dipakai: {Math.floor(40000 / (formData.redeem_rate * 100)) * 100} poin (karena {Math.floor(40000 / (formData.redeem_rate * 100)) * 100} poin = Rp 40.000, tidak bisa melebihi total)
                    </p>
                    <p className="text-xs text-gray-600 font-montserrat mb-1">
                      • Contoh pakai {formData.min_redeem > 150 ? formData.min_redeem : 150} poin: {formData.min_redeem > 150 ? formData.min_redeem : 150} poin = Rp {Math.floor(((formData.min_redeem > 150 ? formData.min_redeem : 150) / 100) * (formData.redeem_rate * 100))?.toLocaleString('id-ID')} diskon
                    </p>
                    <p className="text-xs text-gray-600 font-montserrat">
                      • Total setelah diskon poin: Rp 40.000 - Rp {Math.floor(((formData.min_redeem > 150 ? formData.min_redeem : 150) / 100) * (formData.redeem_rate * 100))?.toLocaleString('id-ID')} = Rp {(40000 - Math.floor(((formData.min_redeem > 150 ? formData.min_redeem : 150) / 100) * (formData.redeem_rate * 100)))?.toLocaleString('id-ID')}
                    </p>
                  </div>
                </div>
              </div>

              {/* Points vs Lifetime Points */}
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <h3 className="font-bold text-gray-900 font-montserrat text-base mb-3 flex items-center gap-2">
                  <Award className="w-5 h-5 text-purple-600" />
                  Points vs Lifetime Points
                </h3>
                
                <div className="space-y-3">
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <h4 className="font-semibold text-gray-900 text-sm font-montserrat mb-2">
                      Points (Poin Terkumpul yang Bisa Digunakan)
                    </h4>
                    <p className="text-sm text-gray-700 font-montserrat leading-relaxed mb-2">
                      Poin terkumpul yang tersedia untuk digunakan sebagai diskon. Poin ini akan berkurang saat digunakan (redeem).
                    </p>
                    <div className="bg-white rounded-lg p-3 border border-gray-100">
                      <p className="text-xs text-gray-600 font-montserrat">
                        <strong>Contoh:</strong> Punya 500 poin terkumpul, pakai 200 poin untuk diskon, sisa 300 poin
                      </p>
                    </div>
                  </div>

                  <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                    <h4 className="font-semibold text-gray-900 text-sm font-montserrat mb-2">
                      Lifetime Points (Total Poin Seumur Hidup)
                    </h4>
                    <p className="text-sm text-gray-700 font-montserrat leading-relaxed mb-2">
                      Total poin yang pernah didapat customer sejak pertama kali order. Lifetime points tidak pernah berkurang, bahkan saat poin digunakan atau expire.
                    </p>
                    <div className="bg-white rounded-lg p-3 border border-purple-100">
                      <p className="text-xs text-gray-600 font-montserrat">
                        <strong>Fungsi:</strong> Digunakan untuk menentukan tier membership (Bronze, Silver, Gold, dll)
                      </p>
                      <p className="text-xs text-gray-600 font-montserrat mt-1">
                        <strong>Contoh:</strong> Total pernah dapat 1.000 poin, pakai 300 poin, lifetime tetap 1.000 poin
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Poin Expire */}
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <h3 className="font-bold text-gray-900 font-montserrat text-base mb-3 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-red-600" />
                  Poin Expire
                </h3>
                
                <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                  <p className="text-sm text-gray-700 font-montserrat leading-relaxed mb-2">
                    Poin yang didapat dari order (bukan bonus) akan expire setelah 1 tahun dari tanggal earning.
                  </p>
                  <div className="bg-white rounded-lg p-3 border border-red-100">
                    <p className="text-xs text-gray-600 font-montserrat">
                      <strong>Poin yang Expire:</strong> Hanya poin dari order (type: earn)
                    </p>
                    <p className="text-xs text-gray-600 font-montserrat mt-1">
                      <strong>Poin yang Tidak Expire:</strong> Bonus order pertama, bonus referral
                    </p>
                    <p className="text-xs text-gray-600 font-montserrat mt-1">
                      <strong>Contoh:</strong> Dapat 100 poin dari order tanggal 1 Januari 2024, poin akan expire tanggal 1 Januari 2025
                    </p>
                  </div>
                </div>
              </div>

              {/* Membership Tier */}
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <h3 className="font-bold text-gray-900 font-montserrat text-base mb-3 flex items-center gap-2">
                  <Award className="w-5 h-5 text-indigo-600" />
                  Membership Tier
                </h3>
                
                <div className="bg-indigo-50 rounded-lg p-4 border border-indigo-200">
                  <p className="text-sm text-gray-700 font-montserrat leading-relaxed mb-2">
                    Tier membership otomatis naik berdasarkan lifetime points. Setiap tier memiliki minimum lifetime points dan diskon persentase.
                  </p>
                  <div className="bg-white rounded-lg p-3 border border-indigo-100">
                    <p className="text-xs text-gray-600 font-montserrat">
                      <strong>Upgrade Otomatis:</strong> Tier naik otomatis saat lifetime points mencapai minimum tier berikutnya
                    </p>
                    <p className="text-xs text-gray-600 font-montserrat mt-1">
                      <strong>Tidak Bisa Downgrade:</strong> Tier tidak akan turun meskipun poin digunakan atau expire
                    </p>
                    <p className="text-xs text-gray-600 font-montserrat mt-1">
                      <strong>Contoh:</strong> Bronze (0 poin), Silver (500 poin), Gold (1.000 poin). Customer dengan 600 lifetime points = Silver tier
                    </p>
                  </div>
                </div>
              </div>

              {/* Tips Penting */}
              <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl p-4 border-2 border-yellow-300">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-yellow-500 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-white text-sm font-bold">!</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-yellow-900 font-montserrat text-sm mb-2">
                      Tips Penting
                    </h3>
                    <ul className="space-y-1.5">
                      <li className="text-xs text-yellow-800 font-montserrat leading-relaxed">
                        • Poin hanya didapat dari order yang sudah <strong>lunas (paid)</strong>, bukan dari order unpaid atau DP
                      </li>
                      <li className="text-xs text-yellow-800 font-montserrat leading-relaxed">
                        • Bonus referral diberikan langsung saat order dibuat, tidak perlu tunggu lunas
                      </li>
                      <li className="text-xs text-yellow-800 font-montserrat leading-relaxed">
                        • Poin bisa dikombinasikan dengan diskon membership atau promo lainnya
                      </li>
                      <li className="text-xs text-yellow-800 font-montserrat leading-relaxed">
                        • Maksimal poin yang bisa dipakai dibatasi sesuai total pesanan setelah diskon lainnya
                      </li>
                      <li className="text-xs text-yellow-800 font-montserrat leading-relaxed">
                        • Lifetime points tidak terpengaruh expire atau penggunaan poin
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Menu 2 Content */}
          {activeMenu === 2 && (
            <div className="space-y-6">
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <h3 className="font-bold text-gray-900 font-montserrat mb-4">Menu 2</h3>
                <p className="text-sm text-gray-600 font-montserrat">
                  Konten Menu 2 akan ditambahkan di sini.
                </p>
              </div>
            </div>
          )}

          {/* Menu 3 Content */}
          {activeMenu === 3 && (
            <div className="space-y-6">
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <h3 className="font-bold text-gray-900 font-montserrat mb-4">Menu 3</h3>
                <p className="text-sm text-gray-600 font-montserrat">
                  Konten Menu 3 akan ditambahkan di sini.
                </p>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Customer Multi-Select Modal for Recalculate */}
      <CustomerMultiSelectModal
        isOpen={showRecalculateModal}
        onClose={() => setShowRecalculateModal(false)}
        onConfirm={(customerIds) => {
          setRecalculateCustomers(customerIds);
          // Fetch customer details for display
          fetchCustomerDetails(customerIds);
        }}
        selectedCustomerIds={recalculateCustomers}
      />

      {/* Customer Multi-Select Modal for Reset */}
      <CustomerMultiSelectModal
        isOpen={showResetModal}
        onClose={() => setShowResetModal(false)}
        onConfirm={(customerIds) => {
          setResetCustomers(customerIds);
          // Fetch customer details for display
          fetchCustomerDetails(customerIds);
        }}
        selectedCustomerIds={resetCustomers}
      />

      {/* Loading Overlay Modal - Recalculate */}
      {recalculating && (
        <div className="fixed inset-0 bg-black bg-opacity-70 z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-md shadow-2xl">
            <div className="p-8">
              <div className="flex flex-col items-center justify-center mb-6">
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent mb-4"></div>
                <h3 className="text-xl font-bold text-gray-900 font-montserrat mb-2">
                  Menghitung Ulang Poin
                </h3>
                <p className="text-sm text-gray-600 font-montserrat text-center">
                  Proses sedang berjalan, harap tunggu...
                </p>
                <p className="text-xs text-orange-600 font-semibold font-montserrat mt-3 text-center">
                  ⚠️ Jangan tutup atau refresh halaman ini selama proses berlangsung
                </p>
                <p className="text-xs text-gray-500 font-montserrat mt-2 text-center">
                  Proses ini memakan waktu beberapa saat, terutama jika customer banyak (bisa 5-10 menit untuk 10rb customer)
                </p>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                <div className="bg-blue-500 h-2 rounded-full animate-pulse" style={{ width: '100%' }}></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Loading Overlay Modal - Reset */}
      {resetting && (
        <div className="fixed inset-0 bg-black bg-opacity-70 z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-md shadow-2xl">
            <div className="p-8">
              <div className="flex flex-col items-center justify-center mb-6">
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-red-500 border-t-transparent mb-4"></div>
                <h3 className="text-xl font-bold text-gray-900 font-montserrat mb-2">
                  Mereset Poin
                </h3>
                <p className="text-sm text-gray-600 font-montserrat text-center">
                  Proses sedang berjalan, harap tunggu...
                </p>
                <p className="text-xs text-orange-600 font-semibold font-montserrat mt-3 text-center">
                  ⚠️ Jangan tutup atau refresh halaman ini selama proses berlangsung
                </p>
                <p className="text-xs text-gray-500 font-montserrat mt-2 text-center">
                  Proses ini memakan waktu beberapa saat, terutama jika customer banyak (bisa 5-10 menit untuk 10rb customer)
                </p>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                <div className="bg-red-500 h-2 rounded-full animate-pulse" style={{ width: '100%' }}></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recalculate Warning Modal */}
      {showRecalculateWarningModal && !recalculating && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <AlertCircle className="w-6 h-6 text-orange-600" />
                <h3 className="text-lg font-bold text-gray-900 font-montserrat">
                  Peringatan
                </h3>
              </div>
              <p className="text-sm text-gray-700 font-montserrat mb-4">
                Proses ini akan menghapus semua poin dan riwayat poin customer, kemudian menghitung ulang dari transaksi yang sudah lunas. Proses ini memakan waktu beberapa saat, terutama jika customer banyak.
              </p>
              <p className="text-sm font-semibold text-orange-800 font-montserrat mb-4">
                ⚠️ Harap tetap di halaman ini selama proses berlangsung. Jika Anda keluar atau menutup halaman, proses akan gagal dan poin tidak akan terhitung ulang.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowRecalculateWarningModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-semibold font-montserrat hover:bg-gray-300 transition-colors"
                >
                  Batal
                </button>
                <button
                  onClick={handleRecalculate}
                  className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg font-semibold font-montserrat hover:bg-blue-600 transition-colors"
                >
                  Lanjutkan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reset Confirmation Modal */}
      {showResetConfirmModal && !resetting && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <AlertCircle className="w-6 h-6 text-red-600" />
                <h3 className="text-lg font-bold text-gray-900 font-montserrat">
                  Konfirmasi Reset Poin
                </h3>
              </div>
              <p className="text-sm text-gray-700 font-montserrat mb-4">
                Anda yakin ingin mereset poin untuk{' '}
                <strong>
                  {resetScope === 'all' ? 'semua customer' : `${resetCustomers.length} customer`}
                </strong>?
              </p>
              <p className="text-sm text-gray-600 font-montserrat mb-4">
                Ketik <strong className="text-red-600">RESET</strong> untuk konfirmasi:
              </p>
              <input
                type="text"
                value={resetConfirmText}
                onChange={(e) => setResetConfirmText(e.target.value)}
                placeholder="Ketik RESET"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-montserrat focus:ring-2 focus:ring-red-500 focus:border-red-500 mb-4"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setShowResetConfirmModal(false);
                    setResetConfirmText('');
                  }}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-semibold font-montserrat hover:bg-gray-300 transition-colors"
                >
                  Batal
                </button>
                <button
                  onClick={handleReset}
                  disabled={resetConfirmText !== 'RESET' || resetting}
                  className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg font-semibold font-montserrat hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Reset Poin
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default PointsSettings;

