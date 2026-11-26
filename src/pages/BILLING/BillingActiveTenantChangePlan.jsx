import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import HeaderBilling from '../../components/Com Header/HeaderBilling';
import AnimatedButton from '../../components/Design/AnimatedButton';
import { 
  ArrowLeft, 
  CheckCircle,
  TrendingUp,
  TrendingDown,
  Star,
  Zap,
  Crown,
  CreditCard
} from 'lucide-react';

const BillingTenantChangePlan = () => {
  const navigate = useNavigate();
  const [currentPlan, setCurrentPlan] = useState(null);
  const [availablePlans, setAvailablePlans] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [loading, setLoading] = useState(true);

  // Mock data - nanti akan diganti dengan API call
  useEffect(() => {
    const mockCurrentPlan = {
      id: 1,
      name: 'NotaPro',
      price: 99000,
      duration: 30,
      features: [
        'Hingga 100 transaksi per bulan',
        'Laporan keuangan lengkap',
        'Support email',
        'Backup otomatis'
      ]
    };

    const mockPlans = [
      {
        id: 2,
        name: 'NotaLite',
        price: 49000,
        duration: 30,
        features: [
          'Hingga 50 transaksi per bulan',
          // 'Laporan dasar',
          'Support email',
          'Backup manual'
        ],
        popular: false,
        type: 'downgrade'
      },
      {
        id: 3,
        name: 'NotaPremium',
        price: 199000,
        duration: 30,
        features: [
          'Hingga 500 transaksi per bulan',
          'Laporan keuangan lengkap',
          'Support 24/7',
          'Backup otomatis',
          'Integrasi WhatsApp',
          'Analytics lanjutan'
        ],
        popular: true,
        type: 'upgrade'
      }
    ];

    setTimeout(() => {
      setCurrentPlan(mockCurrentPlan);
      setAvailablePlans(mockPlans);
      setLoading(false);
    }, 1000);
  }, []);

  const getPlanIcon = (planName) => {
    switch (planName) {
      case 'NotaLite':
        return <Zap className="w-6 h-6" />;
      case 'NotaPro':
        return <Star className="w-6 h-6" />;
      case 'NotaPremium':
        return <Crown className="w-6 h-6" />;
      default:
        return <CreditCard className="w-6 h-6" />;
    }
  };

  const getPlanColor = (planName) => {
    switch (planName) {
      case 'NotaLite':
        return 'from-blue-500 to-blue-600';
      case 'NotaPro':
        return 'from-purple-500 to-purple-600';
      case 'NotaPremium':
        return 'from-yellow-500 to-orange-600';
      default:
        return 'from-gray-500 to-gray-600';
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const handlePlanSelect = (plan) => {
    setSelectedPlan(plan);
  };

  const handleConfirmChange = () => {
    if (selectedPlan) {
      // Navigate to payment page with selected plan
      navigate('/billing-active-tenant-payment', { 
        state: { 
          selectedPlan,
          changePlan: true 
        } 
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600 font-montserrat">Memuat paket langganan...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <HeaderBilling 
        title="Ganti Plan" 
        description="Upgrade atau downgrade paket langganan"
        onBack={() => navigate('/billing-active-tenant')}
      />
      
      <div className="pt-6 pb-6 px-4 max-w-[390px] md:max-w-4xl mx-auto">
        {/* Current Plan */}
        {currentPlan && (
          <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
            <div className="text-center mb-4">
              <h3 className="text-lg font-semibold text-gray-800 font-montserrat mb-2">
                Plan Saat Ini
              </h3>
            </div>
            <div className={`bg-gradient-to-r ${getPlanColor(currentPlan.name)} rounded-xl p-6 text-white`}>
              <div className="flex items-center justify-center mb-4">
                <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                  {getPlanIcon(currentPlan.name)}
                </div>
              </div>
              <h4 className="text-xl font-bold text-center font-montserrat mb-2">
                {currentPlan.name}
              </h4>
              <p className="text-center text-white text-opacity-90 font-montserrat">
                {formatCurrency(currentPlan.price)}/bulan
              </p>
            </div>
          </div>
        )}

        {/* Available Plans */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-800 font-montserrat">
            Pilih Plan Baru
          </h3>
          
          {availablePlans.map((plan) => (
            <div
              key={plan.id}
              className={`bg-white rounded-2xl shadow-sm p-6 border-2 transition-all duration-200 ${
                selectedPlan?.id === plan.id
                  ? 'border-blue-500 ring-2 ring-blue-200'
                  : 'border-gray-100 hover:border-gray-200'
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className={`w-12 h-12 bg-gradient-to-r ${getPlanColor(plan.name)} rounded-xl flex items-center justify-center text-white`}>
                    {getPlanIcon(plan.name)}
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h4 className="text-lg font-semibold text-gray-800 font-montserrat">
                        {plan.name}
                      </h4>
                      {plan.popular && (
                        <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full">
                          Populer
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 font-montserrat">
                      {formatCurrency(plan.price)}/bulan
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  {plan.type === 'upgrade' ? (
                    <TrendingUp className="w-5 h-5 text-green-500" />
                  ) : (
                    <TrendingDown className="w-5 h-5 text-blue-500" />
                  )}
                  <span className={`text-xs font-medium ${
                    plan.type === 'upgrade' ? 'text-green-600' : 'text-blue-600'
                  }`}>
                    {plan.type === 'upgrade' ? 'Upgrade' : 'Downgrade'}
                  </span>
                </div>
              </div>

              <div className="space-y-2 mb-4">
                {plan.features.map((feature, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                    <span className="text-sm text-gray-700 font-montserrat">{feature}</span>
                  </div>
                ))}
              </div>

              <AnimatedButton
                onClick={() => handlePlanSelect(plan)}
                className="w-full"
              >
                <div className={`py-2 px-4 rounded-lg text-center font-medium font-montserrat transition-colors ${
                  selectedPlan?.id === plan.id
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}>
                  {selectedPlan?.id === plan.id ? 'Terpilih' : 'Pilih Plan'}
                </div>
              </AnimatedButton>
            </div>
          ))}
        </div>

        {/* Confirm Button */}
        {selectedPlan && (
          <div className="mt-6 bg-white rounded-2xl shadow-sm p-6">
            <div className="text-center mb-4">
              <h4 className="text-lg font-semibold text-gray-800 font-montserrat mb-2">
                Konfirmasi Perubahan Plan
              </h4>
              <p className="text-sm text-gray-600 font-montserrat">
                Anda akan mengubah dari <span className="font-semibold">{currentPlan?.name}</span> ke{' '}
                <span className="font-semibold">{selectedPlan.name}</span>
              </p>
            </div>
            
            <div className="space-y-3 mb-6">
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-sm text-gray-600 font-montserrat">Plan Lama:</span>
                <span className="text-sm font-semibold text-gray-800 font-montserrat">
                  {formatCurrency(currentPlan?.price || 0)}/bulan
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-sm text-gray-600 font-montserrat">Plan Baru:</span>
                <span className="text-sm font-semibold text-gray-800 font-montserrat">
                  {formatCurrency(selectedPlan.price)}/bulan
                </span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-sm font-semibold text-gray-800 font-montserrat">Selisih:</span>
                <span className={`text-sm font-semibold font-montserrat ${
                  selectedPlan.price > (currentPlan?.price || 0) ? 'text-green-600' : 'text-blue-600'
                }`}>
                  {selectedPlan.price > (currentPlan?.price || 0) ? '+' : ''}
                  {formatCurrency(selectedPlan.price - (currentPlan?.price || 0))}/bulan
                </span>
              </div>
            </div>

            <AnimatedButton
              onClick={handleConfirmChange}
              className="w-full"
            >
              <div className="bg-blue-500 text-white py-3 px-4 rounded-lg text-center font-semibold font-montserrat">
                Lanjutkan ke Pembayaran
              </div>
            </AnimatedButton>
          </div>
        )}
      </div>
    </div>
  );
};

export default BillingTenantChangePlan;
