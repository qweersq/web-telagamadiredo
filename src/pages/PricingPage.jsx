import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import AnimatedButton from '../components/Design/AnimatedButton';
import instance from '../config/api';
import fbPixel from '../utils/facebookPixel';
import ga4 from '../utils/googleAnalytics';
import {
  FaBuilding,
  FaArrowLeft,
  FaCheckCircle,
  FaStar,
  FaUsers,
  FaChartLine,
  FaMobileAlt,
  FaClock,
  FaShieldAlt,
  FaHeadset,
  FaTimes
} from 'react-icons/fa';

const PricingPage = () => {
  const navigate = useNavigate();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedDuration, setSelectedDuration] = useState(null); // Default: Paket Gratis (null = show all including NotaFree)
  const topRef = useRef(null);

  useEffect(() => {
    if (topRef.current) {
      topRef.current.scrollIntoView({ behavior: 'instant' });
    }
    
    // ✅ Funnel Step 2: Pricing Page View
    ga4.trackPricingPage();
    fbPixel.lead('Pricing Page Visit');
    
    fetchSubscriptionPlans();
  }, []); 


  const fetchSubscriptionPlans = async () => {
    try {
      setLoading(true);
      const response = await instance.get('/subscription-plans/active');

      if (response.data.success) {
        let plans = response.data.data;
        
        // Hardcode NotaFree jika ID dan harga match
        const notafreeIndex = plans.findIndex(plan => plan.id === 4 && parseFloat(plan.price) === 0);
        if (notafreeIndex !== -1) {
          plans[notafreeIndex] = {
            id: 4,
            name: 'NotaFree',
            description: 'Paket gratis untuk bisnis laundry sepatu kecil yang belum punya cabang',
            price: 0,
            duration_days: 9999,
            max_branches: 1,
            max_users: 2,
            max_orders_per_month: 50,
            features: {
              input_order: true,
              daily_reports: true,
              multi_payment: true,
              photo_tracking: true,
              digital_invoice: true,
              priority_support: false,
              role_based_access: true,
              advanced_reporting: false,
              follow_up_features: false,
              whatsapp_integration: false,
              campaign_features: false
            }
          };
        }
        
        setPlans(plans);
      } else {
        throw new Error(response.data.message || 'Gagal mengambil data paket');
      }
    } catch (error) {
      console.error('Error fetching subscription plans:', error);
      setError('Gagal mengambil data paket. Menggunakan data default.');
      // Fallback to default plans
      setPlans(getDefaultPlans());
    } finally {
      setLoading(false);
    }
  };

  const getDefaultPlans = () => [
    {
      id: 1,
      name: "NotaLite",
      price: 49000,
      duration_days: 30,
      max_branches: 1,
      max_users: 5,
      max_orders_per_month: 100,
      description: "Paket dasar untuk bisnis kecil",
      features: {
        customer_management: true,
        basic_reporting: true,
        email_support: true
      }
    },
    {
      id: 2,
      name: "NotaPro",
      price: 99000,
      duration_days: 30,
      max_branches: 3,
      max_users: 15,
      max_orders_per_month: 500,
      description: "Paket profesional untuk bisnis berkembang",
      features: {
        customer_management: true,
        advanced_reporting: true,
        whatsapp_integration: true,
        priority_support: true,
        inventory_management: true
      }
    },
    {
      id: 3,
      name: "NotaBusiness",
      price: 199000,
      duration_days: 30,
      max_branches: 999,
      max_users: 999,
      max_orders_per_month: 9999,
      description: "Paket enterprise untuk bisnis besar",
      features: {
        customer_management: true,
        advanced_reporting: true,
        whatsapp_integration: true,
        priority_support: true,
        inventory_management: true,
        api_access: true,
        custom_branding: true,
        multi_branch: true
      }
    }
  ];

  const handleBackToLanding = () => {
    navigate('/');
  };

  const handleSelectPlan = () => {
    navigate('/order');
  };

  const handleSelectCustomPlan = () => {
    navigate('/custom-order');
  };

  const getFeaturesList = (plan) => {
    const features = [];

    // NotaFree special handling - return object dengan available/unavailable
    if (plan.name === 'NotaFree') {
      // Available features
      features.push({ text: `Hingga ${plan.max_branches} cabang`, available: true });
      features.push({ text: `Hingga ${plan.max_users} pengguna`, available: true });
      features.push({ text: `Hingga ${plan.max_orders_per_month} transaksi/bulan`, available: true });
      features.push({ text: "Tracking foto", available: true });
      features.push({ text: "Nota basic", available: true });
      features.push({ text: "Invoice digital", available: true });
      
      // Unavailable features (X)
      features.push({ text: "Download laporan", available: false });
      features.push({ text: "Custom invoice", available: false });
      features.push({ text: "Custom struk", available: false });
      features.push({ text: "Follow up manual", available: false });
      features.push({ text: "Membership", available: false });
      
      return features;
    }

    if (plan.max_branches === 999) {
      features.push({ text: "Cabang tidak terbatas", available: true });
    } else {
      features.push({ text: `Hingga ${plan.max_branches} cabang`, available: true });
    }

    if (plan.max_users === 999) {
      features.push({ text: "Pengguna tidak terbatas", available: true });
    } else {
      features.push({ text: `Hingga ${plan.max_users} pengguna`, available: true });
    }

    // Unlimited transaksi untuk NotaLite, NotaPro, NotaBusiness
    if (plan.name === 'NotaLite' || plan.name === 'NotaPro' || plan.name === 'NotaBusiness') {
      features.push({ text: "Transaksi tidak terbatas/bulan", available: true });
    }

    features.push({ text: "Manajemen pelanggan", available: true });

    if (plan.features?.advanced_reporting) {
      features.push({ text: "Laporan lengkap", available: true });
    }

    // if (plan.features?.whatsapp_integration) {
    //   features.push({ text: "Integrasi WhatsApp", available: true });
    // }

    if (plan.features?.api_access) {
      features.push({ text: "Akses API", available: true });
    }

    if (plan.features?.priority_support) {
      features.push({ text: "Support Prioritas", available: true });
    } else if (plan.features?.email_support) {
      features.push({ text: "Support Email", available: true });
    } else {
      features.push({ text: "Support Dasar", available: true });
    }

    // Fitur premium yang tidak ada di NotaFree
    features.push({ text: "Download laporan", available: true });
    features.push({ text: "Custom invoice", available: true });
    features.push({ text: "Custom struk", available: true });
    features.push({ text: "Follow up manual", available: true });
    features.push({ text: "Membership", available: true });

    features.push({ text: "Trial 7 hari gratis", available: true });

    return features;
  };

  const getColorClasses = (color, popular) => {
    const colors = {
      blue: {
        bg: popular ? 'bg-blue-600' : 'bg-blue-500',
        text: 'text-blue-600',
        border: 'border-blue-200',
        button: 'bg-blue-500 hover:bg-blue-600'
      },
      green: {
        bg: popular ? 'bg-green-600' : 'bg-green-500',
        text: 'text-green-600',
        border: 'border-green-200',
        button: 'bg-green-500 hover:bg-green-600'
      },
      purple: {
        bg: popular ? 'bg-purple-600' : 'bg-purple-500',
        text: 'text-purple-600',
        border: 'border-purple-200',
        button: 'bg-purple-500 hover:bg-purple-600'
      }
    };
    return colors[color];
  };

  // Filter plans berdasarkan durasi yang dipilih
  const getFilteredPlans = () => {
    if (selectedDuration === null) {
      // Paket Gratis: Tampilkan hanya NotaFree
      return plans.filter(plan => plan.name === 'NotaFree' || plan.duration_days === 9999);
    }
    
    // Filter berdasarkan duration_days, exclude NotaFree
    return plans.filter(plan => 
      plan.duration_days === selectedDuration && 
      plan.name !== 'NotaFree' && 
      plan.duration_days !== 9999
    );
  };

  // Group plans berdasarkan kategori
  const getGroupedPlans = () => {
    const filtered = getFilteredPlans();
    const grouped = {
      NotaFree: null,
      NotaLite: null,
      NotaPro: null,
      NotaBusiness: null
    };

    filtered.forEach(plan => {
      if (plan.name === 'NotaFree') {
        grouped.NotaFree = plan;
      } else if (plan.name === 'NotaLite') {
        grouped.NotaLite = plan;
      } else if (plan.name === 'NotaPro') {
        grouped.NotaPro = plan;
      } else if (plan.name === 'NotaBusiness') {
        grouped.NotaBusiness = plan;
      }
    });

    return grouped;
  };

  // Format durasi untuk display
  const getDurationLabel = (days) => {
    if (days === 30) return '1 Bulan';
    if (days === 90) return '3 Bulan';
    if (days === 365) return '1 Tahun';
    return `${days} hari`;
  };

  // Hitung diskon untuk display
  const getDiscountInfo = (plan) => {
    if (plan.name === 'NotaFree' || plan.duration_days === 30) return null;
    
    // Cari harga bulanan untuk perhitungan diskon
    const monthlyPlan = plans.find(p => 
      p.name === plan.name && p.duration_days === 30
    );
    
    if (!monthlyPlan) return null;
    
    const monthlyPrice = parseFloat(monthlyPlan.price);
    const totalMonthlyPrice = monthlyPrice * (plan.duration_days / 30);
    const saved = totalMonthlyPrice - parseFloat(plan.price);
    
    // Gunakan diskon tetap sesuai durasi (sesuai branding)
    let discount;
    if (plan.duration_days === 90) {
      discount = 20; // -20% untuk 3 bulan
    } else if (plan.duration_days === 365) {
      discount = 50; // -50% untuk 1 tahun (tetap, bukan perhitungan)
    } else {
      // Fallback ke perhitungan untuk durasi lain
      discount = Math.round(((totalMonthlyPrice - parseFloat(plan.price)) / totalMonthlyPrice) * 100);
    }
    
    return {
      discount: discount,
      saved: Math.round(saved), // Bulatkan tanpa decimal
      originalPrice: Math.round(totalMonthlyPrice), // Bulatkan tanpa decimal
      monthlyPrice: Math.round(monthlyPrice) // Bulatkan tanpa decimal
    };
  };

  // Hitung diskon untuk tab
  const getTabDiscount = (durationDays) => {
    if (durationDays === 30) return null;
    if (durationDays === 90) return 20; // -20%
    if (durationDays === 365) return 50; // -50%
    return null;
  };

  // Format harga per bulan (dibulatkan)
  const getMonthlyPrice = (plan) => {
    if (plan.name === 'NotaFree') return 0;
    const monthlyPrice = parseFloat(plan.price) / (plan.duration_days / 30);
    return Math.round(monthlyPrice); // Bulatkan tanpa decimal
  };

  return (
    <div ref={topRef} className="min-h-screen bg-gray-50 font-montserrat">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={handleBackToLanding}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <FaArrowLeft className="text-gray-600 text-lg" />
              </button>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                  <FaBuilding className="text-white text-xl" />
                </div>
                <div>
                  <h1 className="text-lg font-semibold font-montserrat text-gray-900">Paket Harga</h1>
                  <p className="text-xs text-gray-600 font-montserrat">Pilih paket yang sesuai dengan kebutuhan bisnis Anda</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Hero Section - Updated with Clarification */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-100 py-12">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 bg-orange-100 text-orange-700 px-4 py-2 rounded-full text-sm font-medium mb-4 border border-orange-200">
            <span>💡</span>
            <span>Pilih Paket - Anda Belum Dikenakan Biaya</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-montserrat text-gray-900 mb-4">
            Pilih Paket yang Tepat untuk Bisnis Anda
          </h1>
          <p className="text-lg text-gray-700 mb-6 max-w-3xl mx-auto font-montserrat font-semibold">
            NotaFree gratis selamanya, atau paket berbayar dengan trial 7 hari gratis. Bayar setelah puas.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-green-600 font-montserrat">
            <div className="flex items-center gap-2">
              <FaCheckCircle className="text-green-600 flex-shrink-0" />
              <span>NotaFree: Gratis selamanya</span>
            </div>
            <div className="flex items-center gap-2">
              <FaCheckCircle className="text-green-600 flex-shrink-0" />
              <span>Trial 7 hari gratis</span>
            </div>
            <div className="flex items-center gap-2">
              <FaCheckCircle className="text-green-600 flex-shrink-0" />
              <span>Bayar setelah puas</span>
            </div>
            <div className="flex items-center gap-2">
              <FaCheckCircle className="text-green-600 flex-shrink-0" />
              <span>Batalkan kapan saja</span>
            </div>
          </div>
        </div>
      </div>

      {/* Duration Tabs */}
      <div className="py-6 md:py-8 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-4 md:mb-6">
            <h2 className="text-xl md:text-2xl font-bold text-gray-900 font-montserrat mb-2">
              Pilih Durasi Berlangganan
            </h2>
            {selectedDuration === 365 && (
              <p className="text-sm md:text-base text-green-600 font-semibold font-montserrat">
                💰 Hemat 50% dengan Paket Tahunan
              </p>
            )}
            {selectedDuration === null && (
              <p className="text-sm md:text-base text-green-600 font-semibold font-montserrat">
                🎁 Paket Gratis Selamanya
              </p>
            )}
          </div>
          
          {/* Desktop Tabs - Horizontal Scroll */}
          <div className="hidden md:flex justify-center gap-4 overflow-x-auto pb-6 pt-8 scrollbar-hide -mx-4 px-4" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch' }}>
            <button
              onClick={() => setSelectedDuration(null)}
              className={`relative flex-shrink-0 min-w-[240px] px-8 py-6 rounded-xl font-medium font-montserrat transition-all duration-300 ${
                selectedDuration === null
                  ? 'bg-green-600 text-white shadow-sm'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
              }`}
            >
              {/* Badge di atas tab */}
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 z-10">
                <span className={`text-xs px-4 py-1.5 rounded-full font-bold shadow-lg border-2 ${
                  selectedDuration === null
                    ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white border-white'
                    : 'bg-gradient-to-r from-green-500 to-emerald-600 text-white border-white'
                }`}>
                  GRATIS
                </span>
              </div>
              <div className="text-lg font-semibold">Paket Gratis</div>
              <div className="text-xs mt-1.5 opacity-70">Selamanya</div>
            </button>
            <button
              onClick={() => setSelectedDuration(30)}
              className={`relative flex-shrink-0 min-w-[220px] px-8 py-6 rounded-xl font-medium font-montserrat transition-all duration-300 ${
                selectedDuration === 30
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
              }`}
            >
              <div className="text-lg font-semibold">1 Bulan</div>
              <div className="text-xs mt-1.5 opacity-70">Harga Normal</div>
            </button>
            <button
              onClick={() => setSelectedDuration(90)}
              className={`relative flex-shrink-0 min-w-[240px] px-8 py-6 rounded-xl font-medium font-montserrat transition-all duration-300 ${
                selectedDuration === 90
                  ? 'bg-orange-500 text-white shadow-sm'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
              }`}
            >
              {/* Badge di atas tab */}
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 z-10">
                <span className="bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs px-4 py-1.5 rounded-full font-bold shadow-lg border-2 border-white">
                  -20%
                </span>
              </div>
              <div className="text-lg font-semibold">3 Bulan</div>
              <div className="text-xs mt-1.5 opacity-70">Paket 3 Bulan</div>
            </button>
            <button
              onClick={() => setSelectedDuration(365)}
              className={`relative flex-shrink-0 min-w-[240px] px-8 py-6 rounded-xl font-medium font-montserrat transition-all duration-300 ${
                selectedDuration === 365
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
              }`}
            >
              {/* Badge di atas tab */}
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 z-10">
                <span className="bg-gradient-to-r from-purple-600 to-pink-500 text-white text-xs px-4 py-1.5 rounded-full font-bold shadow-lg border-2 border-white">
                  -50%
                </span>
              </div>
              <div className="text-lg font-semibold">1 Tahun</div>
              <div className="text-xs mt-1.5 opacity-70">Paket 1 Tahun</div>
            </button>
          </div>

          {/* Mobile Tabs - Horizontal Scroll */}
          <div className="md:hidden">
            <div className="flex gap-3 overflow-x-auto pb-4 pt-5 scrollbar-hide -mx-4 px-4" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch' }}>
              <button
                onClick={() => setSelectedDuration(null)}
                className={`relative flex-shrink-0 min-w-[140px] px-5 py-4 rounded-lg font-medium font-montserrat transition-all duration-300 ${
                  selectedDuration === null
                    ? 'bg-green-600 text-white'
                    : 'bg-white text-gray-700 border border-gray-200'
                }`}
              >
                {/* Badge di atas tab */}
                <div className="absolute -top-2.5 left-1/2 transform -translate-x-1/2 z-10">
                  <span className={`text-[10px] px-3 py-1 rounded-full font-bold shadow-md border-2 ${
                    selectedDuration === null
                      ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white border-white'
                      : 'bg-gradient-to-r from-green-500 to-emerald-600 text-white border-white'
                  }`}>
                    FREE
                  </span>
                </div>
                <div className="text-sm font-semibold">Gratis</div>
              </button>
              <button
                onClick={() => setSelectedDuration(30)}
                className={`relative flex-shrink-0 min-w-[120px] px-5 py-4 rounded-lg font-medium font-montserrat transition-all duration-300 ${
                  selectedDuration === 30
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 border border-gray-200'
                }`}
              >
                <div className="text-sm font-semibold text-center">1 Bulan</div>
              </button>
              <button
                onClick={() => setSelectedDuration(90)}
                className={`relative flex-shrink-0 min-w-[140px] px-5 py-4 rounded-lg font-medium font-montserrat transition-all duration-300 ${
                  selectedDuration === 90
                    ? 'bg-orange-500 text-white'
                    : 'bg-white text-gray-700 border border-gray-200'
                }`}
              >
                {/* Badge di atas tab */}
                <div className="absolute -top-2.5 left-1/2 transform -translate-x-1/2 z-10">
                  <span className="bg-gradient-to-r from-orange-500 to-red-500 text-white text-[10px] px-3 py-1 rounded-full font-bold shadow-md border-2 border-white">
                    -20%
                  </span>
                </div>
                <div className="text-sm font-semibold">3 Bulan</div>
              </button>
              <button
                onClick={() => setSelectedDuration(365)}
                className={`relative flex-shrink-0 min-w-[140px] px-5 py-4 rounded-lg font-medium font-montserrat transition-all duration-300 ${
                  selectedDuration === 365
                    ? 'bg-purple-600 text-white'
                    : 'bg-white text-gray-700 border border-gray-200'
                }`}
              >
                {/* Badge di atas tab */}
                <div className="absolute -top-2.5 left-1/2 transform -translate-x-1/2 z-10">
                  <span className="bg-gradient-to-r from-purple-600 to-pink-500 text-white text-[10px] px-3 py-1 rounded-full font-bold shadow-md border-2 border-white">
                    -50%
                  </span>
                </div>
                <div className="text-sm font-semibold">1 Tahun</div>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="py-4">
        <div className="max-w-7xl mx-auto px-4">
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              <p className="mt-4 text-gray-600 font-montserrat">Memuat paket...</p>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-4">
                <p className="text-yellow-800 font-montserrat">{error}</p>
              </div>
            </div>
          ) : (() => {
            const groupedPlans = getGroupedPlans();
            const plansToShow = [
              groupedPlans.NotaFree,
              groupedPlans.NotaLite,
              groupedPlans.NotaPro,
              groupedPlans.NotaBusiness
            ].filter(Boolean);

            return (
              <>
                {/* Desktop: Grid Layout */}
                <div className="hidden md:flex md:justify-center md:flex-wrap gap-8">
                  {plansToShow.map((plan, index) => {
                    const isPopular = plan.name === 'NotaPro';
                    const isFree = plan.name === 'NotaFree';
                    const features = getFeaturesList(plan);
                    const colors = getColorClasses(isFree ? 'green' : (isPopular ? 'green' : 'blue'), isPopular);

                    return (
                      <div
                        key={plan.id}
                        className={`bg-white rounded-2xl p-8 shadow-sm hover:shadow-lg transition-all duration-200 border-2 w-full max-w-[280px] ${isFree ? 'border-green-200 border-opacity-50' : (isPopular ? `${colors.border} border-opacity-50` : 'border-gray-100')
                          } relative flex flex-col`}
                      >
                        {isFree && (
                          <div className="absolute -top-5 left-1/2 transform -translate-x-1/2 z-10">
                            <div className="bg-gradient-to-r from-green-500 via-emerald-500 to-green-600 text-white px-5 py-2 rounded-full text-xs font-bold flex items-center gap-2 shadow-lg shadow-green-500/50 border-2 border-white">
                              <FaStar className="text-sm animate-pulse" />
                              <span className="tracking-wide">GRATIS SELAMANYA</span>
                            </div>
                          </div>
                        )}
                        {isPopular && !isFree && (
                          <div className="absolute -top-5 left-1/2 transform -translate-x-1/2 z-10">
                            <div className="bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 text-white px-5 py-2 rounded-full text-xs font-bold flex items-center gap-2 shadow-lg shadow-orange-500/50 border-2 border-white animate-pulse">
                              <FaStar className="text-sm" />
                              <span className="tracking-wide">PALING POPULER</span>
                            </div>
                          </div>
                        )}

                        <div className="text-center mb-8">
                          <h3 className="text-lg font-semibold font-montserrat text-gray-900 mb-2">{plan.name}</h3>
                          <p className="text-gray-600 font-montserrat mb-4 text-sm">{plan.description}</p>
                          
                          <div className="mb-4">
                            {plan.name === 'NotaFree' ? (
                              <span className="text-4xl font-bold text-green-600">
                                Gratis
                              </span>
                            ) : (() => {
                              const discountInfo = getDiscountInfo(plan);
                              const monthlyPrice = getMonthlyPrice(plan);
                              const planPrice = parseFloat(plan.price);
                              const isLongTerm = plan.duration_days === 90 || plan.duration_days === 365;
                              
                              return (
                                <div className="space-y-2">
                                  {isLongTerm ? (
                                    <>
                                      {discountInfo && (
                                        <div className="flex items-center justify-center gap-2">
                                          <span className="text-lg text-gray-400 line-through font-montserrat">
                                            Rp {discountInfo.originalPrice.toLocaleString('id-ID')}
                                            {plan.duration_days === 90 ? ' ' : ' '}
                                          </span>
                                        </div>
                                      )}
                                      
                                      <div className="text-4xl font-bold text-gray-900 font-montserrat">
                                        Rp {monthlyPrice.toLocaleString('id-ID')}
                                        <span className="text-2xl font-normal text-gray-600">/bulan</span>
                                      </div>
                                      
                                      <div className="text-base text-gray-600 font-montserrat">
                                        Rp {planPrice.toLocaleString('id-ID')} untuk {plan.duration_days === 90 ? '3 bulan' : '12 bulan'}
                                      </div>
                                      
                                      {discountInfo && (
                                        <div className="mt-2">
                                          <span className="inline-block bg-gradient-to-r from-green-500 to-green-600 text-white px-4 py-1.5 rounded-full text-sm font-bold font-montserrat shadow-md">
                                            Hemat {discountInfo.discount}% (Rp {discountInfo.saved.toLocaleString('id-ID')})
                                          </span>
                                        </div>
                                      )}
                                    </>
                                  ) : (
                                    <>
                                      <div className="text-4xl font-bold text-gray-900 font-montserrat">
                                        Rp {planPrice.toLocaleString('id-ID')}
                                        <span className="text-2xl font-normal text-gray-600">/bulan</span>
                                      </div>
                                      
                                      <div className="text-sm text-gray-500 font-montserrat mt-1">
                                        Per 1 Bulan
                                      </div>
                                    </>
                                  )}
                                </div>
                              );
                            })()}
                          </div>
                        </div>

                        <div className="space-y-4 mb-8 flex-grow">
                          {features.map((feature, featureIndex) => {
                            const featureText = typeof feature === 'string' ? feature : feature.text;
                            const isAvailable = typeof feature === 'string' ? true : feature.available;
                            
                            return (
                            <div key={featureIndex} className="flex items-center gap-3">
                                {isAvailable ? (
                              <FaCheckCircle className="text-green-500 text-sm flex-shrink-0" />
                                ) : (
                                  <FaTimes className="text-red-400 text-sm flex-shrink-0" />
                                )}
                                <span className={`font-montserrat text-sm ${isAvailable ? 'text-gray-700' : 'text-gray-400 line-through'}`}>
                                  {featureText}
                                </span>
                            </div>
                            );
                          })}
                        </div>

                        {/* Footer Card - Always at Bottom */}
                        <div className="mt-auto pt-4 border-t border-gray-100">
                          <AnimatedButton
                            onClick={handleSelectPlan}
                            className={`w-full py-3 px-6 rounded-xl text-white font-semibold font-montserrat ${plan.name === 'NotaFree' ? 'bg-green-500 hover:bg-green-600' : colors.button} transition-all duration-200`}
                          >
                            Daftar & Coba Gratis 7 Hari
                          </AnimatedButton>
                          <p className="text-center text-xs text-gray-500 mt-2 font-montserrat">
                            Belum dikenakan biaya
                          </p>
                        </div>
                      </div>
                    );
                  })}

                </div>

                {/* Mobile: Horizontal Scroll */}
                <div className="md:hidden">
                  <div className="flex gap-4 overflow-x-auto pb-4 pt-6 scrollbar-hide -mx-4 px-4" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch' }}>
                    {plansToShow.map((plan, index) => {
                      const isPopular = plan.name === 'NotaPro';
                      const isFree = plan.name === 'NotaFree';
                      const features = getFeaturesList(plan);
                      const colors = getColorClasses(isFree ? 'green' : (isPopular ? 'green' : 'blue'), isPopular);

                      return (
                        <div
                          key={plan.id}
                          className={`flex-shrink-0 w-[85vw] max-w-sm bg-white rounded-2xl p-6 shadow-sm border-2 ${isFree ? 'border-green-200 border-opacity-50' : (isPopular ? `${colors.border} border-opacity-50` : 'border-gray-100')
                            } relative flex flex-col`}
                        >
                          {isFree && (
                            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 z-10">
                              <div className="bg-gradient-to-r from-green-500 via-emerald-500 to-green-600 text-white px-4 py-1.5 rounded-full text-[10px] font-bold flex items-center gap-1.5 shadow-md shadow-green-500/40 border-2 border-white">
                                <FaStar className="text-[10px] animate-pulse" />
                                <span className="tracking-wide">GRATIS SELAMANYA</span>
                              </div>
                            </div>
                          )}
                          {isPopular && !isFree && (
                            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 z-10">
                              <div className="bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 text-white px-4 py-1.5 rounded-full text-[10px] font-bold flex items-center gap-1.5 shadow-md shadow-orange-500/40 border-2 border-white">
                                <FaStar className="text-[10px]" />
                                <span className="tracking-wide">PALING POPULER</span>
                              </div>
                            </div>
                          )}

                          <div className="text-center mb-6">
                            <h3 className="text-base font-semibold font-montserrat text-gray-900 mb-2">{plan.name}</h3>
                            <p className="text-gray-600 font-montserrat mb-3 text-xs">{plan.description}</p>
                      
                            <div className="mb-4">
                              {plan.name === 'NotaFree' ? (
                                <span className="text-3xl font-bold text-green-600">
                                  Gratis
                                </span>
                              ) : (() => {
                          const discountInfo = getDiscountInfo(plan);
                          const monthlyPrice = getMonthlyPrice(plan);
                          const planPrice = parseFloat(plan.price);
                          const isLongTerm = plan.duration_days === 90 || plan.duration_days === 365;
                          
                          return (
                            <div className="space-y-2">
                              {/* Untuk 3 bulan dan 1 tahun: tonjolkan harga bulanan */}
                              {isLongTerm ? (
                                <>
                                  {/* Harga Asli Total (dicoret) - Total tanpa potongan */}
                                  {discountInfo && (
                                    <div className="flex items-center justify-center gap-2">
                                      <span className="text-lg text-gray-400 line-through font-montserrat">
                                        Rp {discountInfo.originalPrice.toLocaleString('id-ID')}
                                        {/* {plan.duration_days === 90 ? ' untuk 3 bulan' : ' untuk 12 bulan'} */}
                                      </span>
                                    </div>
                                  )}
                                  
                                      {/* Harga Bulanan (DITONJOLKAN) */}
                                      <div className="text-3xl font-bold text-gray-900 font-montserrat">
                                        Rp {monthlyPrice.toLocaleString('id-ID')}
                                        <span className="text-xl font-normal text-gray-600">/bulan</span>
                                      </div>
                                      
                                      {/* Harga Total (BIASA) */}
                                      <div className="text-sm text-gray-600 font-montserrat">
                                        Rp {planPrice.toLocaleString('id-ID')} untuk {plan.duration_days === 90 ? '3 bulan' : '12 bulan'}
                                      </div>
                                      
                                      {/* Diskon Badge */}
                                      {discountInfo && (
                                        <div className="mt-2">
                                          <span className="inline-block bg-gradient-to-r from-green-500 to-green-600 text-white px-3 py-1 rounded-full text-xs font-bold font-montserrat shadow-md">
                                            Hemat {discountInfo.discount}% (Rp {discountInfo.saved.toLocaleString('id-ID')})
                                          </span>
                                        </div>
                                      )}
                                </>
                              ) : (
                                <>
                                      {/* Untuk 1 bulan: tonjolkan harga total */}
                                      <div className="text-3xl font-bold text-gray-900 font-montserrat">
                                        Rp {planPrice.toLocaleString('id-ID')}
                                        <span className="text-xl font-normal text-gray-600">/bulan</span>
                                      </div>
                                      
                                      <div className="text-xs text-gray-500 font-montserrat mt-1">
                                        Per 1 Bulan
                                      </div>
                                </>
                              )}
                            </div>
                          );
                        })()}
                            </div>
                          </div>

                          <div className="space-y-3 mb-6 flex-grow">
                            {features.map((feature, featureIndex) => {
                              const featureText = typeof feature === 'string' ? feature : feature.text;
                              const isAvailable = typeof feature === 'string' ? true : feature.available;
                              
                              return (
                                <div key={featureIndex} className="flex items-center gap-3">
                                  {isAvailable ? (
                                    <FaCheckCircle className="text-green-500 text-sm flex-shrink-0" />
                                  ) : (
                                    <FaTimes className="text-red-400 text-sm flex-shrink-0" />
                                  )}
                                  <span className={`font-montserrat text-sm ${isAvailable ? 'text-gray-700' : 'text-gray-400 line-through'}`}>
                                    {featureText}
                                  </span>
                                </div>
                              );
                            })}
                          </div>

                          {/* Footer Card - Always at Bottom */}
                          <div className="mt-auto pt-3 border-t border-gray-100">
                            <AnimatedButton
                              onClick={handleSelectPlan}
                              className={`w-full py-2.5 px-4 rounded-xl text-white text-sm font-semibold font-montserrat ${plan.name === 'NotaFree' ? 'bg-green-500 hover:bg-green-600' : colors.button} transition-all duration-200`}
                            >
                              Daftar & Coba Gratis 7 Hari
                            </AnimatedButton>
                            <p className="text-center text-[10px] text-gray-500 mt-1.5 font-montserrat">
                              Belum dikenakan biaya
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            );
          })()}
        </div>
      </div>

      {/* Custom Apps Section - Above Footer */}
      <div className="py-16 bg-gradient-to-br from-purple-50 via-indigo-50 to-purple-100">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            {/* Left: Content */}
            <div className="text-center md:text-left">
              <div className="inline-block mb-4">
                <span className="bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 text-white px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2 shadow-lg shadow-purple-500/50 border-2 border-white">
                  <FaStar className="text-sm" />
                  <span className="tracking-wide">EKSKLUSIF</span>
                </span>
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 font-montserrat mb-4">
                Custom Apps
              </h2>
              <p className="text-lg text-gray-700 font-montserrat mb-6">
                Aplikasi khusus untuk bisnis Anda dengan database personal
              </p>
              <div className="mb-6">
                <span className="text-4xl font-bold text-purple-600 font-montserrat">
                  Custom NotaSepatu
                </span>
                <p className="text-base text-gray-600 font-montserrat mt-2">Harga disesuaikan kebutuhan</p>
              </div>
              <AnimatedButton
                onClick={handleSelectCustomPlan}
                className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-4 px-8 rounded-xl transition-all duration-200 font-montserrat"
              >
                Konsultasi Custom Apps
              </AnimatedButton>
              <p className="text-sm text-gray-500 mt-3 font-montserrat">
                Konsultasi gratis
              </p>
            </div>

            {/* Right: Features */}
            <div className="bg-white rounded-2xl p-8 shadow-lg border-2 border-purple-200">
              <h3 className="text-xl font-bold text-gray-900 mb-6 font-montserrat">Fitur Eksklusif</h3>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <FaCheckCircle className="text-purple-500 text-lg flex-shrink-0" />
                  <span className="text-gray-700 font-montserrat">Aplikasi khusus hanya untuk Anda</span>
                </div>
                <div className="flex items-center gap-3">
                  <FaCheckCircle className="text-purple-500 text-lg flex-shrink-0" />
                  <span className="text-gray-700 font-montserrat">Database personal & terpisah</span>
                </div>
                <div className="flex items-center gap-3">
                  <FaCheckCircle className="text-purple-500 text-lg flex-shrink-0" />
                  <span className="text-gray-700 font-montserrat">Custom branding & domain</span>
                </div>
                <div className="flex items-center gap-3">
                  <FaCheckCircle className="text-purple-500 text-lg flex-shrink-0" />
                  <span className="text-gray-700 font-montserrat">Fitur sesuai kebutuhan bisnis</span>
                </div>
                <div className="flex items-center gap-3">
                  <FaCheckCircle className="text-purple-500 text-lg flex-shrink-0" />
                  <span className="text-gray-700 font-montserrat">Dedicated support 24/7</span>
                </div>
                <div className="flex items-center gap-3">
                  <FaCheckCircle className="text-purple-500 text-lg flex-shrink-0" />
                  <span className="text-gray-700 font-montserrat">Unlimited everything</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>





      {/* Footer */}
      <div className="bg-gray-900 py-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center gap-3 mb-4 md:mb-0">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <img src="/images/notasepatulogo.png" alt="NotaSepatu" className="w-full h-full" />
              </div>
              <div>
                <h3 className="text-xl font-montserrat text-white">NotaSepatu</h3>
                <p className="text-xs text-gray-400 font-montserrat">Manajemen Laundry Sepatu</p>
              </div>
            </div>
            <div className="text-center md:text-right">
              <p className="text-sm text-gray-400 font-montserrat">
                ©2025 NotaSepatu. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PricingPage;
