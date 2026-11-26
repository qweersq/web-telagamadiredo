import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import AnimatedButton from '../components/Design/AnimatedButton';
import WhatsAppContact from '../components/WhatsAppContact';
// ✅ COMMENTED OUT: No longer need API calls
// import instance from '../config/api';
import { 
  FaArrowLeft,
  FaWhatsapp,
  FaCheckCircle,
  FaExclamationTriangle,
  FaSpinner,
  FaClock,
  FaEnvelope,
  FaUser,
  FaBuilding,
  FaPhone,
  FaMapMarkerAlt,
  FaArrowRight,
  FaRedo
} from 'react-icons/fa';

const VerifyWA = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // ✅ SIMPLIFIED: Just get basic info for display
  const orderData = location.state?.orderData;
  const orderId = location.state?.orderId;
  
  // ✅ COMMENTED OUT: No longer need verification states
  // const [loading, setLoading] = useState(false);
  // const [error, setError] = useState('');
  // const [verificationStatus, setVerificationStatus] = useState('pending');
  // const [accountInfo, setAccountInfo] = useState(null);
  // const [pollingInterval, setPollingInterval] = useState(null);
  const topRef = useRef(null);

  // Scroll to top when component mounts
  useEffect(() => {
    if (topRef.current) {
      topRef.current.scrollIntoView({ behavior: 'instant' });
    }
  }, []);

  // ✅ COMMENTED OUT: No longer need polling for verification
  /*
  // Start polling for verification status
  useEffect(() => {
    if (orderId && verificationStatus === 'pending') {
      startPolling();
    }
    
    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
    };
  }, [orderId, verificationStatus]);
  */

  // ✅ COMMENTED OUT: No longer need verification methods
  /*
  const startPolling = () => {
    console.log('🔄 Starting verification status polling...');
    
    // Check immediately
    checkVerificationStatus();
    
    // Then check every 5 seconds
    const interval = setInterval(() => {
      checkVerificationStatus();
    }, 5000);
    
    setPollingInterval(interval);
    
    // Stop polling after 10 minutes
    setTimeout(() => {
      if (interval) {
        clearInterval(interval);
        setPollingInterval(null);
        console.log('⏰ Polling stopped after 10 minutes');
      }
    }, 10 * 60 * 1000);
  };

  const checkVerificationStatus = async () => {
    try {
      const response = await instance.get(`/tenant-orders/${orderId}/verification-status`);
      
      if (response.data.success) {
        const status = response.data.data;
        console.log('📊 Verification status:', status);
        
        if (status.is_verified) {
          console.log('✅ Account verified! Redirecting...');
          setVerificationStatus('verified');
          setAccountInfo(status);
          
          // Stop polling
          if (pollingInterval) {
            clearInterval(pollingInterval);
            setPollingInterval(null);
          }
          
          // Redirect to success page after 2 seconds
          setTimeout(() => {
            navigate('/login', {
              state: {
                message: 'Akun berhasil diverifikasi! Silakan login dengan email dan password Anda.',
                email: status.email
              }
            });
          }, 2000);
        }
      }
    } catch (error) {
      console.error('❌ Error checking verification status:', error);
      // Don't show error for polling failures to avoid spam
    }
  };

  const handleResendLink = async () => {
    setLoading(true);
    setError('');
    
    try {
      console.log('🔄 Resending verification link...');
      
      const response = await instance.post('/tenant-orders/resend-verification', {
        order_id: orderId
      });
      
      if (response.data.success) {
        console.log('✅ Verification link resent successfully');
        alert('Link verifikasi baru telah dikirim ke WhatsApp Anda!');
      } else {
        throw new Error(response.data.message || 'Gagal mengirim ulang link verifikasi');
      }
      
    } catch (error) {
      console.error('❌ Error resending verification link:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Gagal mengirim ulang link verifikasi';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };
  */

  const handleBackToOrder = () => {
    navigate('/order', { state: { plan: orderData?.selected_plan } });
  };

  const handleGoToLogin = () => {
    navigate('/login');
  };

  // ✅ SIMPLIFIED: If no order data, redirect to order form
  if (!orderData) {
    navigate('/order');
    return null;
  }

  return (
    <div ref={topRef} className="min-h-screen bg-gray-50 font-montserrat">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={handleBackToOrder}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <FaArrowLeft className="text-gray-600 text-lg" />
            </button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                <FaWhatsapp className="text-white text-xl" />
              </div>
              <div>
                <h1 className="text-lg font-semibold font-montserrat text-gray-900">Akun Berhasil Dibuat</h1>
                <p className="text-xs text-gray-600 font-montserrat">Akun Anda sudah aktif dan siap digunakan</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl p-6 shadow-sm sticky top-8">
              <h3 className="text-xl font-montserrat text-gray-900 mb-4">Ringkasan Pesanan</h3>
              
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <FaBuilding className="text-blue-500 text-lg" />
                  <div>
                    <p className="text-xs text-gray-600 font-montserrat">Nama Bisnis</p>
                    <p className="font-semibold text-gray-900 font-montserrat">{orderData.business_name}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <FaUser className="text-green-500 text-lg" />
                  <div>
                    <p className="text-xs text-gray-600 font-montserrat">Pemilik</p>
                    <p className="font-semibold text-gray-900 font-montserrat">{orderData.owner_name}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <FaEnvelope className="text-purple-500 text-lg" />
                  <div>
                    <p className="text-xs text-gray-600 font-montserrat">Email</p>
                    <p className="font-semibold text-gray-900 font-montserrat">{orderData.email}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <FaWhatsapp className="text-green-500 text-lg" />
                  <div>
                    <p className="text-xs text-gray-600 font-montserrat">WhatsApp</p>
                    <p className="font-semibold text-gray-900 font-montserrat">{orderData.whatsapp}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <FaMapMarkerAlt className="text-red-500 text-lg" />
                  <div>
                    <p className="text-xs text-gray-600 font-montserrat">Lokasi</p>
                    <p className="font-semibold text-gray-900 font-montserrat">{orderData.city}</p>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-gray-200">
                <div className="bg-blue-50 rounded-lg p-3">
                  <p className="text-xs font-semibold text-blue-800 font-montserrat">Paket: {orderData.selected_plan}</p>
                  <p className="text-xs text-blue-600 font-montserrat">Trial 7 hari gratis</p>
                </div>
              </div>
            </div>
          </div>

          {/* ✅ NEW: Success Message */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl p-6 shadow-sm">
              
              <div className="text-center">
                <div className="bg-green-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
                  <FaCheckCircle className="text-3xl text-green-500" />
                </div>
                
                <h2 className="text-2xl font-semibold font-montserrat text-gray-900 mb-4">
                  🎉 Akun Berhasil Dibuat!
                </h2>
                
                <p className="text-gray-600 mb-6 font-montserrat text-lg">
                  Akun NotaSepatu Anda sudah aktif dan siap digunakan. Anda dapat langsung login dengan email dan password yang telah Anda buat.
                </p>
                
                <div className="bg-blue-50 rounded-xl p-4 mb-6">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <FaEnvelope className="text-blue-600" />
                    <p className="text-lg font-semibold text-blue-800 font-montserrat">
                      {orderData.email}
                    </p>
                  </div>
                  <p className="text-sm text-blue-700 font-montserrat">
                    Gunakan email ini untuk login ke akun Anda
                  </p>
                </div>

                {/* ✅ NEW: Simple action buttons */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <AnimatedButton
                    onClick={handleGoToLogin}
                    variant="blue"
                    className="flex items-center gap-2 px-8 py-3 text-lg"
                  >
                    Login ke Akun
                    <FaArrowRight />
                  </AnimatedButton>
                  
                  <AnimatedButton
                    onClick={handleBackToOrder}
                    variant="outline"
                    className="flex items-center gap-2 px-8 py-3 text-lg"
                  >
                    <FaArrowLeft />
                    Kembali ke Order
                  </AnimatedButton>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* WhatsApp Contact Component */}
      <WhatsAppContact />
    </div>
  );
};

export default VerifyWA;