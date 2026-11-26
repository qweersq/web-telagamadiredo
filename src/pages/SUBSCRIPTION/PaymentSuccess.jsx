import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FaCheckCircle, FaClock, FaEnvelope, FaPhone, FaArrowRight } from 'react-icons/fa';
import AnimatedButton from '../../components/Design/AnimatedButton';

const PaymentSuccess = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get payment data from sessionStorage or location.state
  const getPaymentData = () => {
    const fromSession = sessionStorage.getItem('paymentData');
    if (fromSession) {
      return JSON.parse(fromSession);
    }
    return location.state?.paymentData;
  };
  
  const paymentData = getPaymentData();

  const [countdown, setCountdown] = useState(5);
  const [isRedirecting, setIsRedirecting] = useState(false);

  // Countdown timer
  // useEffect(() => {
  //   const timer = setInterval(() => {
  //     setCountdown((prev) => {
  //       if (prev <= 1) {
  //         setIsRedirecting(true);
  //         setTimeout(() => {
  //           navigate('/');
  //         }, 1000);
  //         return 0;
  //       }
  //       return prev - 1;
  //     });
  //   }, 1000);

  //   return () => clearInterval(timer);
  // }, [navigate]);

  const handleGoToLogin = () => {
    window.location.href = '/login';
  };

  const handleGoToDashboard = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Success Icon */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-green-100 rounded-full mb-6">
            <FaCheckCircle className="text-6xl text-green-500" />
          </div>
          <h1 className="text-lg font-semibold font-bold text-gray-900 font-montserrat mb-3">
            🎉 Pembayaran Berhasil Dikirim!
          </h1>
          <p className="text-base text-gray-600 font-montserrat">
            Terima kasih telah melakukan pembayaran. Tim kami akan segera memproses verifikasi Anda.
          </p>
        </div>

        {/* Payment Details Card */}
        {paymentData && (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-6">
            <h2 className="text-lg font-bold text-gray-800 font-montserrat mb-4">
              📋 Detail Pembayaran
            </h2>

            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 font-montserrat">Payment ID:</span>
                <span className="text-sm font-bold text-gray-900 font-montserrat font-mono">
                  {paymentData.payment_id || 'PAY-' + Date.now()}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 font-montserrat">Status:</span>
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-bold bg-yellow-100 text-yellow-800 font-montserrat">
                  <FaClock className="mr-1" />
                  Pending Verification
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 font-montserrat">Estimasi Verifikasi:</span>
                <span className="text-sm font-bold text-gray-900 font-montserrat">
                  1x24 jam
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Verification Process Card */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-6">
          <h2 className="text-lg font-bold text-gray-800 font-montserrat mb-4">
            ⏳ Proses Verifikasi
          </h2>

          <div className="space-y-4">
            <div className="flex items-start">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                <span className="text-sm font-bold text-blue-600 font-montserrat">1</span>
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-900 font-montserrat">
                  Pengecekan Bukti Transfer
                </h3>
                <p className="text-xs text-gray-600 font-montserrat mt-1">
                  Tim kami akan memverifikasi bukti transfer yang Anda kirimkan
                </p>
              </div>
            </div>

            <div className="flex items-start">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                <span className="text-sm font-bold text-blue-600 font-montserrat">2</span>
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-900 font-montserrat">
                  Aktivasi Subscription
                </h3>
                <p className="text-xs text-gray-600 font-montserrat mt-1">
                  Setelah verifikasi berhasil, subscription akan diaktifkan otomatis
                </p>
              </div>
            </div>

            <div className="flex items-start">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                <span className="text-sm font-bold text-blue-600 font-montserrat">3</span>
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-900 font-montserrat">
                  Notifikasi Konfirmasi
                </h3>
                <p className="text-xs text-gray-600 font-montserrat mt-1">
                  Anda akan menerima email konfirmasi setelah proses selesai
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-6">
          <h2 className="text-lg font-bold text-gray-800 font-montserrat mb-4">
            📞 Butuh Bantuan?
          </h2>

          <div className="space-y-3">
            <div className="flex items-center">
              <FaEnvelope className="text-blue-500 mr-3" />
              <div>
                <p className="text-sm font-bold text-gray-900 font-montserrat">
                  Email Support
                </p>
                <p className="text-xs text-gray-600 font-montserrat">
                  notasepatu@yahoo.com
                </p>
              </div>
            </div>

            <div className="flex items-center">
              <FaPhone className="text-green-500 mr-3" />
              <div>
                <p className="text-sm font-bold text-gray-900 font-montserrat">
                  WhatsApp Support
                </p>
                <p className="text-xs text-gray-600 font-montserrat">
                  +6287778942773
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          {/* <AnimatedButton
            onClick={handleGoToDashboard}
            className="w-full py-3 px-4 rounded-lg font-bold font-montserrat text-base bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700"
          >
            <FaArrowRight className="inline mr-2" />
            Ke Dashboard
          </AnimatedButton> */}

          <AnimatedButton
            onClick={handleGoToLogin}
            className="w-full py-2 px-4 rounded-lg font-bold font-montserrat text-base bg-gray-100 text-gray-700 hover:bg-gray-200"
          >
            Ke Halaman Login
          </AnimatedButton>
        </div>

        {/* Auto Redirect Notice */}
        {/* <div className="text-center mt-6">
          <p className="text-xs text-gray-500 font-montserrat">
            <span>Otomatis kembali ke halaman login dalam {countdown} detik</span>
          </p>
        </div> */}
      </div>
    </div>
  );
};

export default PaymentSuccess;
