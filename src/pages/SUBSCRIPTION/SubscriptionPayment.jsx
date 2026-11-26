import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AnimatedButton from '../../components/Design/AnimatedButton';
import { getUserProfile } from '../../utils/userProfileHelper';
import { FaCreditCard, FaUpload, FaCheckCircle, FaExclamationTriangle, FaClock, FaCrown, FaShieldAlt, FaRedo } from 'react-icons/fa';
import { parseSecureUrlParam } from '../../utils/secureDataHelper';

const SubscriptionPayment = () => {
  const navigate = useNavigate();
  const { encryptedData } = useParams();
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState(null);
  const [subscriptionData, setSubscriptionData] = useState(null);
  const [availablePlans, setAvailablePlans] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [isSuspended, setIsSuspended] = useState(false);
  const [reactivationInfo, setReactivationInfo] = useState(null);
  const [reactivating, setReactivating] = useState(false);
  // Removed payment form state - now using separate checkout page

  useEffect(() => {
    checkUserRole();
  }, []);

  // Check for pending payment when component mounts
  useEffect(() => {
    const checkPendingPayment = async () => {
      try {
        // Get encrypted data dari URL parameter untuk API call
        if (!encryptedData) {
          console.log('❌ No encrypted data found in URL for pending payment check');
          return;
        }
        
        console.log('🔍 Checking for pending payment with encrypted data from URL...');
        
        // Decrypt data untuk mendapatkan user_id dan tenant_id
        const decryptedData = parseSecureUrlParam(encryptedData);
        if (!decryptedData) {
          console.log('❌ Failed to decrypt data for pending payment check');
          return;
        }
        
        // Use fetch with Authorization header
        const response = await fetch('http://localhost:3002/subscriptions/check-pending-payment', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${encryptedData}`,
            'Content-Type': 'application/json'
          }
        });
        
        const data = await response.json();
        
        if (data.success && data.data.has_pending_payment) {
          console.log('✅ Found pending payment, redirecting to PaymentSuccess');
          // Ada pending payment, redirect ke PaymentSuccess
          const paymentData = data.data.payment_data;
          sessionStorage.setItem('paymentData', JSON.stringify(paymentData));
          window.location.href = '/payment-success';
          return;
        }
        
        console.log('ℹ️ No pending payment found, continuing normally');
        // Tidak ada pending payment, lanjut tampilkan paket
        
      } catch (error) {
        console.error('❌ Error checking pending payment:', error);
        // Lanjut normal jika error
      }
    };
    
    // Only check if user role is already set (after checkUserRole completes)
    if (userRole) {
      checkPendingPayment();
    }
  }, [userRole, encryptedData]);

  const checkUserRole = async () => {
    try {
      // Get encrypted data from URL parameter first
      console.log('🔍 URL encrypted data:', encryptedData);
      
      if (encryptedData) {
        try {
          // Decrypt dan verify signature
          const decryptedData = parseSecureUrlParam(encryptedData);
          
          if (!decryptedData) {
            console.error('❌ Failed to decrypt or verify data');
            setUserRole('invalid_data');
            return;
          }
          
          console.log('🔐 Decrypted and verified data:', decryptedData);
          
          const {
            user_id,
            tenant_id,
            role,
            tenant_name,
            subscription_status,
            tenant_status,
            days_remaining,
            message
          } = decryptedData;
          
          setUserRole(role);
          console.log('✅ User role from encrypted data:', role);
          
          // Only allow superadmin and admin to access subscription payment
          if (role === 'superadmin' || role === 'admin') {
            // Check if tenant is suspended
            const isTenantSuspended = tenant_status === 'suspended';
            setIsSuspended(isTenantSuspended);
            
            // Set subscription data from encrypted data
            setSubscriptionData({
              tenant: {
                id: tenant_id,
                business_name: tenant_name || 'Unknown',
                subscription_status: subscription_status || 'cancelled',
                status: tenant_status || 'suspended',
                days_remaining: days_remaining || 0
              },
              user: {
                id: user_id,
                role: role
              },
              is_active: false,
              message: message || 'Subscription tidak aktif, silakan lakukan pembayaran'
            });
            
            // If suspended, fetch reactivation info instead of regular plans
            if (isTenantSuspended) {
              console.log('🚫 Tenant is suspended, fetching reactivation info');
              fetchReactivationInfo();
            } else {
              fetchAvailablePlans();
            }
          } else {
            console.log('❌ Access denied: Role not allowed for subscription payment');
            setUserRole('unauthorized');
          }
        } catch (decryptError) {
          console.error('❌ Error decrypting data:', decryptError);
          setUserRole('invalid_data');
        }
      } else {
        console.log('❌ No encrypted data found, trying localStorage fallback');
        
        // Fallback to localStorage if no JWT token
        const userData = localStorage.getItem('userData');
        if (userData) {
          const user = JSON.parse(userData);
          const role = user.role || user.user_role;
          setUserRole(role);
          console.log('✅ User role from localStorage fallback:', role);
          
          if (role === 'superadmin' || role === 'admin') {
            fetchSubscriptionData();
            fetchAvailablePlans();
          } else {
            setUserRole('unauthorized');
          }
        } else {
          console.log('❌ No user data found, showing access denied');
          setUserRole('no_data');
        }
      }
    } catch (error) {
      console.error('❌ Error checking user role:', error);
      setUserRole('error');
    } finally {
      setLoading(false);
    }
  };

  const fetchSubscriptionData = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3002/subscriptions/my-status', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSubscriptionData(data.data);
        console.log('✅ Subscription data:', data.data);
      } else {
        throw new Error(data.message || 'Failed to fetch subscription data');
      }
    } catch (error) {
      console.error('❌ Error fetching subscription data:', error);
      
      // Set default subscription data for payment form
      setSubscriptionData({
        tenant: {
          subscription_status: 'cancelled',
          status: 'suspended',
          business_name: 'Unknown',
          days_remaining: 0
        },
        is_active: false,
        message: 'Subscription tidak aktif, silakan lakukan pembayaran'
      });
    }
  };

  const fetchAvailablePlans = async () => {
    try {
      // Use the public API endpoint that doesn't require authentication
      const response = await fetch('http://localhost:3002/subscription-plans/active');
      const data = await response.json();
      
      if (data.success && data.data) {
        setAvailablePlans(data.data);
        console.log('✅ Available plans from API:', data.data);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error('❌ Error fetching available plans:', error);
      
      // Fallback to default plans if API fails
      console.log('💳 Showing default plans as fallback');
      setAvailablePlans([
        {
          id: 1,
          name: 'NotaLite',
          description: 'Paket starter untuk bisnis laundry kecil',
          price: '49000.00',
          duration_days: 30,
          max_branches: 1,
          max_users: 5,
          max_orders_per_month: null,
          features: {
            input_order: true,
            daily_reports: true,
            multi_payment: true,
            photo_tracking: true,
            digital_invoice: true,
            priority_support: false,
            role_based_access: true,
            auto_notifications: false,
            whatsapp_integration: false
          }
        },
        {
          id: 2,
          name: 'NotaPro',
          description: 'Paket profesional dengan fitur WhatsApp',
          price: '99000.00',
          duration_days: 30,
          max_branches: 3,
          max_users: 15,
          max_orders_per_month: null,
          features: {
            input_order: true,
            daily_reports: true,
            multi_payment: true,
            photo_tracking: true,
            digital_invoice: true,
            priority_support: false,
            role_based_access: true,
            auto_notifications: true,
            whatsapp_integration: true
          }
        },
        {
          id: 3,
          name: 'NotaBusiness',
          description: 'Paket enterprise dengan fitur lengkap',
          price: '199000.00',
          duration_days: 30,
          max_branches: 999,
          max_users: 999,
          max_orders_per_month: null,
          features: {
            input_order: true,
            daily_reports: true,
            multi_payment: true,
            photo_tracking: true,
            digital_invoice: true,
            priority_support: true,
            role_based_access: true,
            auto_notifications: true,
            whatsapp_integration: true
          }
        }
      ]);
    }
  };

  const fetchReactivationInfo = async () => {
    try {
      console.log('🔍 Fetching reactivation info for suspended tenant');
      
      const token = localStorage.getItem('token') || encryptedData;
      const response = await fetch('http://localhost:3002/reactivation/info', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      
      if (data.success) {
        setReactivationInfo(data.data);
        console.log('✅ Reactivation info:', data.data);
      }
      
      // Also fetch available plans for reactivation
      await fetchAvailablePlans();
    } catch (error) {
      console.error('❌ Error fetching reactivation info:', error);
      // If error, still show plans for reactivation
      await fetchAvailablePlans();
    }
  };

  const handleReactivation = async (planId, paymentMethod = 'bank_transfer') => {
    try {
      setReactivating(true);
      console.log('🔄 Starting reactivation process:', { planId, paymentMethod });
      
      const token = localStorage.getItem('token') || encryptedData;
      const response = await fetch('http://localhost:3002/reactivation/reactivate', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          plan_id: planId,
          payment_method: paymentMethod
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        console.log('✅ Reactivation successful:', data.data);
        
        // Show success message and redirect
        alert('Reactivation berhasil! Akun Anda telah diaktifkan kembali.');
        
        // Clear all session data and redirect to dashboard
        localStorage.removeItem('token');
        localStorage.removeItem('userData');
        localStorage.removeItem('selectedRole');
        localStorage.removeItem('selectedBranchId');
        sessionStorage.clear();
        
        navigate('/login');
      } else {
        throw new Error(data.message || 'Reactivation failed');
      }
    } catch (error) {
      console.error('❌ Error during reactivation:', error);
      alert('Gagal melakukan reactivation. Silakan coba lagi atau hubungi support.');
    } finally {
      setReactivating(false);
    }
  };

  const handlePlanSelect = (plan) => {
    setSelectedPlan(plan);
    
    // For both suspended and regular tenants, go to checkout page
    // Store data in sessionStorage for CheckoutPage
    sessionStorage.setItem('selectedPlan', JSON.stringify(plan));
    sessionStorage.setItem('subscriptionData', JSON.stringify(subscriptionData));
    
    // Store suspended status for checkout page to handle differently
    if (isSuspended) {
      sessionStorage.setItem('isSuspended', 'true');
    }
    
    // Store encrypted data for suspended tenants
    if (encryptedData) {
      sessionStorage.setItem('encryptedData', encryptedData);
    }
    
    // Use window.location for full page reload to ensure scroll starts from top
    window.location.href = '/checkout';
  };

  // Removed unused payment functions - now handled in checkout page

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active':
        return <FaCheckCircle className="text-green-500 text-lg font-semibold" />;
      case 'trial':
        return <FaClock className="text-yellow-500 text-lg font-semibold" />;
      case 'expired':
      case 'cancelled':
        return <FaExclamationTriangle className="text-red-500 text-lg font-semibold" />;
      default:
        return <FaExclamationTriangle className="text-gray-500 text-lg font-semibold" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'trial':
        return 'bg-yellow-100 text-yellow-800';
      case 'expired':
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatPrice = (price) => {
    // Handle both string and number prices
    const numericPrice = typeof price === 'string' ? parseFloat(price) : price;
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(numericPrice);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600 text-sm font-montserrat">Memuat halaman pembayaran...</p>
        </div>
      </div>
    );
  }

  // If user role is not allowed, show access denied
  if (userRole && userRole !== 'superadmin' && userRole !== 'admin') {
    const getAccessDeniedMessage = () => {
      switch (userRole) {
        case 'unauthorized':
          return {
            title: 'Akses Ditolak',
            message: 'Halaman ini hanya dapat diakses oleh Superadmin dan Admin',
            buttonText: 'Kembali ke Beranda'
          };
        case 'no_data':
          return {
            title: 'Data Pengguna Tidak Ditemukan',
            message: 'Silakan login ulang untuk mengakses halaman ini',
            buttonText: 'Ke Halaman Login'
          };
        case 'error':
          return {
            title: 'Terjadi Kesalahan',
            message: 'Gagal memverifikasi akses pengguna',
            buttonText: 'Kembali ke Beranda'
          };
        case 'invalid_token':
          return {
            title: 'Token Tidak Valid',
            message: 'Token akses tidak valid atau telah kedaluwarsa',
            buttonText: 'Ke Halaman Login'
          };
        case 'invalid_data':
          return {
            title: 'Data Tidak Valid',
            message: 'Data yang diterima tidak valid atau telah dimodifikasi. Silakan akses ulang halaman ini.',
            buttonText: 'Ke Halaman Login'
          };
        default:
          return {
            title: 'Akses Ditolak',
            message: 'Halaman ini hanya dapat diakses oleh Superadmin dan Admin',
            buttonText: 'Kembali ke Beranda'
          };
      }
    };

    const accessDeniedInfo = getAccessDeniedMessage();

    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FaExclamationTriangle className="text-red-500 text-lg font-semibold" />
          </div>
          <h1 className="text-xl font-semibold text-gray-900 font-montserrat mb-2">
            {accessDeniedInfo.title}
          </h1>
          <p className="text-gray-600 font-montserrat mb-4">
            {accessDeniedInfo.message}
          </p>
          <AnimatedButton
            onClick={() => {
              if (userRole === 'no_data' || userRole === 'invalid_token') {
                // Clear all data and redirect to login
                localStorage.removeItem('token');
                localStorage.removeItem('userData');
                localStorage.removeItem('selectedRole');
                localStorage.removeItem('selectedBranchId');
                navigate('/login');
              } else {
                navigate('/login');
              }
            }}
            className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-montserrat"
          >
            {accessDeniedInfo.buttonText}
          </AnimatedButton>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-xl font-bold text-gray-900 font-montserrat mb-3">
            {isSuspended ? '🔄 Reaktivasi Akun' : '💳 Pembayaran Langganan'}
          </h1>
          <p className="text-base text-gray-600 font-montserrat max-w-2xl mx-auto mb-4">
            {isSuspended 
              ? 'Akun Anda telah disuspend karena pembayaran terlambat. Pilih paket untuk mengaktifkan kembali akun Anda dengan langganan baru.'
              : 'Pilih paket langganan yang sesuai dengan kebutuhan bisnis Anda dan nikmati fitur-fitur premium'
            }
          </p>
          
        </div>

        {/* Current Subscription Status */}
        {subscriptionData && (
          <div className={`rounded-2xl shadow-lg border p-8 mb-8 ${
            isSuspended 
              ? 'bg-red-50 border-red-200' 
              : 'bg-white border-gray-100'
          }`}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-800 font-montserrat">
                {isSuspended ? '🚫 Status Akun Tersuspend' : '📊 Status Langganan Saat Ini'}
              </h2>
              {getStatusIcon(subscriptionData.tenant.subscription_status)}
            </div>
            
            {isSuspended && (
              <div className="mb-6 p-4 bg-red-100 border border-red-300 rounded-lg">
                <div className="flex items-center mb-2">
                  <FaExclamationTriangle className="text-red-600 mr-2" />
                  <h3 className="font-bold text-red-800 font-montserrat">Akun Disuspend</h3>
                </div>
                <p className="text-red-700 font-montserrat text-sm">
                  Akun Anda telah disuspend karena pembayaran terlambat. Semua tagihan yang tertunda akan dibatalkan dan Anda dapat memulai dengan langganan baru.
                </p>
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
                <h3 className="font-bold text-gray-700 font-montserrat mb-2 text-base">🏢 Tenant</h3>
                <p className="text-gray-900 font-montserrat text-lg font-semibold">{subscriptionData.tenant.business_name}</p>
              </div>
              
              <div className={`rounded-xl p-4 border ${
                isSuspended 
                  ? 'bg-gradient-to-r from-red-50 to-red-100 border-red-200'
                  : 'bg-gradient-to-r from-green-50 to-green-100 border-green-200'
              }`}>
                <h3 className="font-bold text-gray-700 font-montserrat mb-2 text-base">📊 Status</h3>
                <span className={`px-3 py-1 rounded-full text-sm font-bold font-montserrat ${getStatusColor(subscriptionData.tenant.subscription_status)}`}>
                  {isSuspended ? 'Suspended' : subscriptionData.tenant.subscription_status}
                </span>
              </div>
              
              <div className="bg-gradient-to-r from-orange-50 to-orange-100 rounded-xl p-4 border border-orange-200">
                <h3 className="font-bold text-gray-700 font-montserrat mb-2 text-base">
                  {isSuspended ? '🔄 Aksi' : '⏰ Trial Berakhir'}
                </h3>
                <p className="text-gray-900 font-montserrat text-lg font-semibold">
                  {isSuspended 
                    ? 'Pilih paket untuk reaktivasi'
                    : (subscriptionData.tenant.days_remaining > 0 
                        ? `${subscriptionData.tenant.days_remaining} hari lagi`
                        : 'Trial telah berakhir')
                  }
                </p>
              </div>
            </div>
            
            <div className={`mt-4 p-4 rounded-lg ${
              isSuspended ? 'bg-red-100' : 'bg-blue-50'
            }`}>
              <p className={`font-montserrat ${
                isSuspended ? 'text-red-800' : 'text-blue-800'
              }`}>
                <FaExclamationTriangle className="inline mr-2" />
                {subscriptionData.message}
              </p>
            </div>
          </div>
        )}

        {/* Available Plans */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-800 font-montserrat mb-6 text-center">
            {isSuspended ? '🔄 Pilih Paket untuk Reaktivasi' : '🚀 Paket Langganan Tersedia'}
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {availablePlans.map((plan) => (
              <div
                key={plan.id}
                className={`border-2 rounded-xl p-6 cursor-pointer transition-all duration-300 transform hover:scale-105 ${
                  selectedPlan?.id === plan.id
                    ? 'border-blue-500 bg-gradient-to-br from-blue-50 to-blue-100 shadow-xl'
                    : 'border-gray-200 hover:border-blue-300 hover:shadow-lg bg-white'
                }`}
                onClick={() => handlePlanSelect(plan)}
              >
                <div className="text-center mb-4">
                  <FaCrown className="text-3xl text-blue-500 mx-auto mb-3" />
                  <h3 className="text-xl font-bold text-gray-900 font-montserrat mb-2">
                    {plan.name}
                  </h3>
                  <p className="text-sm text-gray-600 font-montserrat leading-relaxed">
                    {plan.description}
                  </p>
                </div>
                
                <div className="text-center mb-4">
                  <div className="text-3xl font-bold text-blue-600 font-montserrat mb-1">
                    {formatPrice(plan.price)}
                  </div>
                  <div className="text-sm text-gray-500 font-montserrat font-medium">
                    per {plan.duration_days} hari
                  </div>
                </div>
                
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm font-montserrat">
                    <span className="text-gray-600 font-medium">Max Cabang:</span>
                    <span className="text-gray-900 font-bold">{plan.max_branches === 999 ? 'Unlimited' : plan.max_branches}</span>
                  </div>
                  <div className="flex justify-between text-sm font-montserrat">
                    <span className="text-gray-600 font-medium">Max User:</span>
                    <span className="text-gray-900 font-bold">{plan.max_users === 999 ? 'Unlimited' : plan.max_users}</span>
                  </div>
                  {plan.max_orders_per_month && (
                    <div className="flex justify-between text-sm font-montserrat">
                      <span className="text-gray-600 font-medium">Max Order/Bulan:</span>
                      <span className="text-gray-900 font-bold">{plan.max_orders_per_month}</span>
                    </div>
                  )}
                </div>
                
                {/* Features Section */}
                {plan.features && (
                  <div className="mb-4">
                    <h4 className="text-sm font-bold text-gray-700 font-montserrat mb-3 text-center">✨ Fitur Tersedia:</h4>
                    <div className="space-y-1">
                      {plan.features.input_order && (
                        <div className="flex items-center text-xs text-gray-600 font-montserrat">
                          <span className="text-green-500 mr-2">✓</span>
                          Input Order
                        </div>
                      )}
                      {plan.features.daily_reports && (
                        <div className="flex items-center text-xs text-gray-600 font-montserrat">
                          <span className="text-green-500 mr-2">✓</span>
                          Laporan Harian
                        </div>
                      )}
                      {plan.features.multi_payment && (
                        <div className="flex items-center text-xs text-gray-600 font-montserrat">
                          <span className="text-green-500 mr-2">✓</span>
                          Multi Payment
                        </div>
                      )}
                      {plan.features.photo_tracking && (
                        <div className="flex items-center text-xs text-gray-600 font-montserrat">
                          <span className="text-green-500 mr-2">✓</span>
                          Photo Tracking
                        </div>
                      )}
                      {plan.features.digital_invoice && (
                        <div className="flex items-center text-xs text-gray-600 font-montserrat">
                          <span className="text-green-500 mr-2">✓</span>
                          Digital Invoice
                        </div>
                      )}
                      {plan.features.whatsapp_integration && (
                        <div className="flex items-center text-xs text-gray-600 font-montserrat">
                          <span className="text-green-500 mr-2">✓</span>
                          WhatsApp Integration
                        </div>
                      )}
                      {plan.features.auto_notifications && (
                        <div className="flex items-center text-xs text-gray-600 font-montserrat">
                          <span className="text-green-500 mr-2">✓</span>
                          Auto Notifications
                        </div>
                      )}
                      {plan.features.priority_support && (
                        <div className="flex items-center text-xs text-gray-600 font-montserrat">
                          <span className="text-green-500 mr-2">✓</span>
                          Priority Support
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                <AnimatedButton
                  className={`w-full py-3 px-4 rounded-lg font-bold font-montserrat text-base transition-all duration-300 ${
                    selectedPlan?.id === plan.id
                      ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg transform scale-105'
                      : 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 hover:from-gray-200 hover:to-gray-300 hover:shadow-md'
                  }`}
                  disabled={reactivating}
                >
                  {reactivating && selectedPlan?.id === plan.id 
                    ? '🔄 Mengaktifkan...'
                    : (selectedPlan?.id === plan.id 
                        ? '✅ Dipilih' 
                        : (isSuspended ? '🔄 Reaktivasi Sekarang' : '🚀 Pilih Paket'))
                  }
                </AnimatedButton>
              </div>
            ))}
          </div>
        </div>

        {/* Payment Form - Removed, now using separate checkout page */}
        {false && selectedPlan && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-xl font-semibold text-gray-800 font-montserrat mb-6">
              Form Pembayaran - {selectedPlan.name}
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Payment Details */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 font-montserrat mb-2">
                    Metode Pembayaran
                  </label>
                  <select
                    value={paymentData.payment_method}
                    onChange={(e) => setPaymentData(prev => ({ ...prev, payment_method: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-montserrat"
                  >
                    <option value="bank_transfer">Transfer Bank</option>
                    <option value="virtual_account">Virtual Account</option>
                    <option value="qris">QRIS</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 font-montserrat mb-2">
                    Bank Tujuan
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: BCA, Mandiri, BRI"
                    value={paymentData.bank_name}
                    onChange={(e) => setPaymentData(prev => ({ ...prev, bank_name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-montserrat"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 font-montserrat mb-2">
                    Nomor Rekening
                  </label>
                  <input
                    type="text"
                    placeholder="1234567890"
                    value={paymentData.account_number}
                    onChange={(e) => setPaymentData(prev => ({ ...prev, account_number: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-montserrat"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 font-montserrat mb-2">
                    Nama Pemilik Rekening
                  </label>
                  <input
                    type="text"
                    placeholder="Nama lengkap pemilik rekening"
                    value={paymentData.account_holder}
                    onChange={(e) => setPaymentData(prev => ({ ...prev, account_holder: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-montserrat"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 font-montserrat mb-2">
                    Jumlah Pembayaran
                  </label>
                  <input
                    type="text"
                    value={formatPrice(paymentData.amount)}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 font-montserrat"
                  />
                </div>
              </div>
              
              {/* Upload Section */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 font-montserrat mb-2">
                    Upload Bukti Transfer
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <FaUpload className="text-4xl text-gray-400 mx-auto mb-4" />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                      id="payment-proof"
                    />
                    <label
                      htmlFor="payment-proof"
                      className="cursor-pointer text-blue-600 hover:text-blue-700 font-montserrat"
                    >
                      Klik untuk upload bukti transfer
                    </label>
                    {paymentData.payment_proof && (
                      <p className="text-sm text-green-600 font-montserrat mt-2">
                        ✅ {paymentData.payment_proof.name}
                      </p>
                    )}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 font-montserrat mb-2">
                    Catatan (Opsional)
                  </label>
                  <textarea
                    placeholder="Tambahkan catatan untuk admin..."
                    value={paymentData.notes}
                    onChange={(e) => setPaymentData(prev => ({ ...prev, notes: e.target.value }))}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-montserrat"
                  />
                </div>
              </div>
            </div>
            
            <div className="mt-6 flex gap-4">
              <AnimatedButton
                onClick={() => setShowPaymentForm(false)}
                className="px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 font-montserrat"
              >
                Batal
              </AnimatedButton>
              <AnimatedButton
                onClick={handleSubmitPayment}
                className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-montserrat"
              >
                Kirim Pembayaran
              </AnimatedButton>
            </div>
          </div>
        )}

        {/* Back to Dashboard */}
        <div className="text-center mt-8">
          <AnimatedButton
            onClick={() => navigate('/login')}
            className="px-6 py-3 bg-gray-500 text-white rounded-lg font-montserrat hover:bg-gray-600"
          >
            Kembali ke Login
          </AnimatedButton>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionPayment;
