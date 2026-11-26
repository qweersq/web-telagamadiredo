import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AnimatedButton from '../components/Design/AnimatedButton';
import instance from '../config/api';
import { 
  FaCheckCircle,
  FaExclamationTriangle,
  FaSpinner,
  FaArrowRight,
  FaBuilding,
  FaEnvelope,
  FaCalendarAlt
} from 'react-icons/fa';

const VerificationSuccess = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [verificationResult, setVerificationResult] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (token) {
      verifyToken();
    } else {
      setError('Token verifikasi tidak ditemukan');
      setLoading(false);
    }
  }, [token]);

  const verifyToken = async () => {
    try {
      setLoading(true);
      console.log('🔄 Verifying token:', token);
      
      const response = await instance.get(`/tenant-orders/verify/${token}`);
      
      if (response.data.success) {
        console.log('✅ Verification successful:', response.data);
        setVerificationResult(response.data.data);
      } else {
        throw new Error(response.data.message || 'Verifikasi gagal');
      }
      
    } catch (error) {
      console.error('❌ Verification error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Gagal memverifikasi link';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleGoToLogin = () => {
    navigate('/login');
  };

  const handleBackToHome = () => {
    navigate('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center font-montserrat">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-500 mx-auto mb-6"></div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Memverifikasi Akun</h2>
          <p className="text-gray-600">Mohon tunggu sebentar...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 font-montserrat">
        <div className="max-w-2xl mx-auto px-4 py-16">
          <div className="bg-white rounded-xl p-8 shadow-sm text-center">
            <div className="bg-red-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
              <FaExclamationTriangle className="text-3xl text-red-500" />
            </div>
            
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Verifikasi Gagal</h1>
            <p className="text-gray-600 mb-8">{error}</p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <AnimatedButton
                onClick={handleBackToHome}
                variant="outline"
                className="px-6 py-3"
              >
                Kembali ke Beranda
              </AnimatedButton>
              <AnimatedButton
                onClick={handleGoToLogin}
                variant="blue"
                className="px-6 py-3"
              >
                Coba Login
              </AnimatedButton>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 font-montserrat">
      <div className="max-w-2xl mx-auto px-4 py-16">
        <div className="bg-white rounded-xl p-8 shadow-sm text-center">
          {/* Success Icon */}
          <div className="bg-green-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
            <FaCheckCircle className="text-3xl text-green-500" />
          </div>
          
          {/* Success Message */}
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            🎉 Verifikasi Berhasil!
          </h1>
          <p className="text-lg text-gray-600 mb-8">
            Selamat! Akun NotaSepatu Anda telah berhasil diaktifkan.
          </p>
          
          {/* Account Details */}
          {verificationResult && (
            <div className="bg-blue-50 rounded-xl p-6 mb-8 text-left">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">Detail Akun Anda</h3>
              
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <FaBuilding className="text-blue-500 text-lg" />
                  <div>
                    <p className="text-sm text-gray-600">Nama Bisnis</p>
                    <p className="font-semibold text-gray-900">{verificationResult.business_name}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <FaEnvelope className="text-green-500 text-lg" />
                  <div>
                    <p className="text-sm text-gray-600">Email Login</p>
                    <p className="font-semibold text-gray-900">{verificationResult.email}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <FaCalendarAlt className="text-purple-500 text-lg" />
                  <div>
                    <p className="text-sm text-gray-600">Diverifikasi pada</p>
                    <p className="font-semibold text-gray-900">
                      {new Date(verificationResult.verified_at).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Trial Information */}
          <div className="bg-yellow-50 rounded-xl p-4 mb-8">
            <h4 className="font-semibold text-yellow-800 mb-2">🆓 Trial Gratis Aktif</h4>
            <p className="text-sm text-yellow-700">
              Nikmati 7 hari trial gratis untuk semua fitur NotaSepatu. 
              Mulai kelola bisnis laundry sepatu Anda sekarang!
            </p>
          </div>
          
          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <AnimatedButton
              onClick={handleBackToHome}
              variant="outline"
              className="px-6 py-3"
            >
              Kembali ke Beranda
            </AnimatedButton>
            <AnimatedButton
              onClick={handleGoToLogin}
              variant="blue"
              className="px-6 py-3 flex items-center gap-2"
            >
              Login ke Dashboard
              <FaArrowRight className="text-sm" />
            </AnimatedButton>
          </div>
          
          {/* Additional Info */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-500">
              Gunakan email dan password yang Anda buat saat registrasi untuk login.
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Butuh bantuan? Hubungi support kami di{' '}
              <a href="mailto:notasepatu@gmail.com" className="text-blue-600 hover:underline">
                notasepatu@gmail.com
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerificationSuccess;
