import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import HeaderBilling from '../../components/Com Header/HeaderBilling';
import AnimatedButton from '../../components/Design/AnimatedButton';
import { getUserProfile } from '../../utils/userProfileHelper';
import { 
  CreditCard, 
  History, 
  RefreshCw, 
  TrendingUp, 
  TrendingDown,
  Calendar,
  Receipt,
  Settings,
  Package,
  CreditCard as PaymentMethods
} from 'lucide-react';

const BillingTenantManajemen = () => {
  const navigate = useNavigate();
  const [tenantId, setTenantId] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [subscriptionStatus, setSubscriptionStatus] = useState(null);

  // Load user profile and tenant ID
  useEffect(() => {
    const loadUserProfile = async () => {
      try {
        setLoading(true);
        const profile = await getUserProfile();
        
        if (profile?.tenant?.id) {
          setTenantId(profile.tenant.id);
          setUserProfile(profile);
          setSubscriptionStatus(profile.tenant?.subscription_status || 'trial');
          console.log('✅ BillingTenantManajemen - Tenant ID loaded:', profile.tenant.id);
          console.log('✅ BillingTenantManajemen - Subscription Status:', profile.tenant?.subscription_status);
        } else {
          console.warn('⚠️ BillingTenantManajemen - No tenant ID found in profile');
        }
      } catch (error) {
        console.error('❌ BillingTenantManajemen - Failed to load user profile:', error);
      } finally {
        setLoading(false);
      }
    };

    loadUserProfile();
  }, []);

  // Dynamic menu items based on tenant status
  const getMenuItems = () => {
    const baseItems = [
      {
        id: 'current-billing',
        title: 'Billing Sekarang',
        description: 'Lihat dan kelola pembayaran yang sedang berjalan',
        icon: CreditCard,
        color: 'bg-blue-500',
        route: '/billing-active-tenant-payment'
      },
      {
        id: 'billing-history',
        title: 'Riwayat Pembayaran',
        description: 'Lihat semua riwayat pembayaran sebelumnya',
        icon: History,
        color: 'bg-green-500',
        route: '/billing-active-tenant-history'
      }
    ];

    return baseItems;
  };

  const menuItems = getMenuItems();

  const handleMenuClick = (route) => {
    // Pass tenant ID as state to child pages
    navigate(route, { state: { tenantId, userProfile } });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-500 mx-auto"></div>
          <p className="mt-6 text-gray-700 font-medium text-lg">Memuat data billing...</p>
          <p className="mt-2 text-gray-500 text-sm">Mohon tunggu sebentar</p>
        </div>
      </div>
    );
  }

  if (!tenantId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Tenant ID Tidak Ditemukan</h3>
          <p className="text-gray-500 mb-6">Tidak dapat memuat data billing. Silakan login ulang.</p>
          <button
            onClick={() => navigate('/login')}
            className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200"
          >
            Kembali ke Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <HeaderBilling 
        title="Billing Management" 
        description={`Kelola pembayaran dan langganan`}
        onBack={() => navigate("/berandaowner")}
      />
      
      <div className="pt-4 pb-6 px-2 max-w-[390px] md:max-w-4xl mx-auto">
        {/* Tenant Info */}
        {userProfile && (
          <div className="mb-6 bg-white rounded-xl p-4 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-800 font-montserrat">
                  {userProfile.tenant?.business_name || 'Tenant'}
                </h3>
                <p className="text-sm text-gray-600 font-montserrat">
                  Status: <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                    subscriptionStatus === 'active' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {subscriptionStatus === 'active' ? 'Active' : 'Trial'}
                  </span>
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500 font-montserrat">Tenant ID</p>
                <p className="text-sm font-semibold text-gray-800 font-montserrat">{tenantId}</p>
              </div>
            </div>
          </div>
        )}

        {/* Menu Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {menuItems.map((item) => {
            const IconComponent = item.icon;
            return (
              <AnimatedButton
                key={item.id}
                onClick={() => handleMenuClick(item.route)}
                className="w-full"
              >
                <div className="bg-white rounded-2xl shadow-sm p-6 hover:shadow-md transition-all duration-200 border border-gray-100">
                  <div className="flex items-start space-x-4">
                    <div className={`w-12 h-12 ${item.color} rounded-xl flex items-center justify-center flex-shrink-0`}>
                      <IconComponent className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1 min-w-0 text-left">
                      <h3 className="text-lg font-semibold text-gray-800 font-montserrat mb-2">
                        {item.title}
                      </h3>
                      <p className="text-sm text-gray-600 font-montserrat leading-relaxed text-left">
                        {item.description}
                      </p>
                    </div>
                    <div className="flex-shrink-0">
                      <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center">
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
              </AnimatedButton>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default BillingTenantManajemen;
