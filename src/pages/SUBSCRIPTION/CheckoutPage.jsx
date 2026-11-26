import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FaArrowLeft, FaCheckCircle, FaBuilding, FaCreditCard, FaRedo } from 'react-icons/fa';
import AnimatedButton from '../../components/Design/AnimatedButton';
import instance from '../../config/api';
import { parseSecureUrlParam } from '../../utils/secureDataHelper';
import billingService from '../../services/billingService';

const CheckoutPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get data from sessionStorage or location.state
  const getSelectedPlan = () => {
    const fromSession = sessionStorage.getItem('selectedPlan');
    if (fromSession) {
      return JSON.parse(fromSession);
    }
    return location.state?.selectedPlan;
  };
  
  const getSubscriptionData = () => {
    const fromSession = sessionStorage.getItem('subscriptionData');
    if (fromSession) {
      return JSON.parse(fromSession);
    }
    return location.state?.subscriptionData;
  };
  
  const getEncryptedData = () => {
    const fromSession = sessionStorage.getItem('encryptedData');
    if (fromSession) {
      return fromSession;
    }
    return location.state?.encryptedData;
  };
  
  const getIsSuspended = () => {
    const fromSession = sessionStorage.getItem('isSuspended');
    return fromSession === 'true';
  };
  
  const selectedPlan = getSelectedPlan();
  const subscriptionData = getSubscriptionData();
  const encryptedData = getEncryptedData();
  const isSuspended = getIsSuspended();

  const [paymentMethod, setPaymentMethod] = useState('bank_transfer_bca');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentCode, setPaymentCode] = useState(null);

  // Generate payment code between 100-500 based on price
  useEffect(() => {
    if (!paymentCode && selectedPlan?.price) {
      // Extract last 3 digits from price and ensure it's between 100-500
      const price = parseFloat(selectedPlan.price);
      const lastThreeDigits = Math.floor(price) % 1000;
      
      // Map to range 100-500
      // 000-099 -> 100-199
      // 100-199 -> 100-199 (keep as is)
      // 200-299 -> 200-299 (keep as is)
      // 300-399 -> 300-399 (keep as is)
      // 400-499 -> 400-499 (keep as is)
      // 500-599 -> 500-500 (cap at 500)
      // 600+ -> 100-199 (cycle back)
      
      let code;
      if (lastThreeDigits < 100) {
        code = lastThreeDigits + 100; // 000-099 becomes 100-199
      } else if (lastThreeDigits <= 500) {
        code = lastThreeDigits; // 100-500 keep as is
      } else {
        code = ((lastThreeDigits - 500) % 400) + 100; // 501+ cycles back to 100-500
      }
      
      setPaymentCode(code.toString());
    }
  }, [selectedPlan, paymentCode]);

  // Bank account details - REKENING TUJUAN (PENERIMA)
  const bankAccounts = {
    bank_transfer_bca: {
      name: 'BCA',
      accountNumber: '1234567890',
      accountHolder: 'PT NotaSepatu Indonesia',
      logo: '🏦',
      payment_method: 'bank_transfer'
    },
    bank_transfer_mandiri: {
      name: 'Mandiri',
      accountNumber: '0987654321',
      accountHolder: 'PT NotaSepatu Indonesia',
      logo: '🏛️',
      payment_method: 'bank_transfer'
    },
    bank_transfer_bri: {
      name: 'BRI',
      accountNumber: '1122334455',
      accountHolder: 'PT NotaSepatu Indonesia',
      logo: '🏪',
      payment_method: 'bank_transfer'
    },
    bank_transfer_bni: {
      name: 'BNI',
      accountNumber: '5566778899',
      accountHolder: 'PT NotaSepatu Indonesia',
      logo: '🏢',
      payment_method: 'bank_transfer'
    }
  };


  const handleSubmitPayment = async () => {
    if (!paymentCode) {
      alert('Kode pembayaran belum tersedia');
      return;
    }

    setIsSubmitting(true);

    try {
      if (isSuspended) {
        // For suspended tenants, use reactivation flow
        console.log('🔄 Processing reactivation payment for suspended tenant');
        
        // First, reactivate the tenant (this creates new subscription and billing)
        const reactivationResult = await billingService.reactivateTenant(selectedPlan.id, selectedBank.payment_method);
        console.log('✅ Tenant reactivated:', reactivationResult);
        
        // Then submit payment with unique code for the new billing
        const newBilling = reactivationResult.billing;
        
        const paymentData = {
          billing_id: newBilling.id,
          payment_method: selectedBank.payment_method,
          bank_name: selectedBank.name,
          account_number: selectedBank.accountNumber,
          account_holder: selectedBank.accountHolder,
          amount: selectedPlan.price,
          payment_code: paymentCode,
          notes: `Reactivation payment for ${selectedPlan.name} subscription via ${selectedBank.name} - Code: ${paymentCode}`
        };

        // Submit payment with unique code
        const paymentResponse = await instance.post('/tenant-payments/submit-payment', paymentData);

        console.log('✅ Reactivation payment submitted:', paymentResponse.data);

        // Store payment data for success page
        const successData = {
          payment_id: newBilling.id,
          payment_code: paymentResponse.data.data?.payment_code || paymentCode,
          status: 'pending_verification',
          estimated_verification_time: '1x24 jam',
          plan_name: selectedPlan.name,
          amount: selectedPlan.price,
          bank_name: selectedBank.name,
          is_reactivation: true
        };
        
        sessionStorage.setItem('paymentData', JSON.stringify(successData));
        
      } else {
        // Regular subscription payment flow
        const paymentData = {
          plan_id: selectedPlan.id,
          payment_method: selectedBank.payment_method,
          bank_name: selectedBank.name,
          account_number: selectedBank.accountNumber,
          account_holder: selectedBank.accountHolder,
          amount: selectedPlan.price,
          payment_code: paymentCode,
          notes: `Payment for ${selectedPlan.name} subscription via ${selectedBank.name} - Code: ${paymentCode}`
        };

        console.log('📋 Submitting regular payment:', {
          plan_id: selectedPlan.id,
          payment_method: selectedBank.payment_method,
          bank_name: selectedBank.name,
          amount: selectedPlan.price,
          payment_code: paymentCode
        });

        const headers = {
          'Content-Type': 'application/json',
        };
        
        // Add encrypted data for suspended tenants
        if (encryptedData) {
          headers['Authorization'] = `Bearer ${encryptedData}`;
          console.log('🔐 Using encrypted data for payment submission');
        }
        
        const response = await instance.post('/subscriptions/submit-payment', paymentData, {
          headers,
        });

        console.log('✅ Payment submitted successfully:', response.data);

        // Store payment data for success page
        const successData = {
          payment_id: response.data.data?.payment_id || `PAY-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          payment_code: paymentCode,
          status: 'pending_verification',
          estimated_verification_time: '1x24 jam',
          plan_name: selectedPlan.name,
          amount: selectedPlan.price,
          bank_name: selectedBank.name
        };
        
        sessionStorage.setItem('paymentData', JSON.stringify(successData));
      }
      
      // Clear suspended status
      sessionStorage.removeItem('isSuspended');
      
      // Use window.location for full page reload to ensure clean state
      window.location.href = '/payment-success';
      
    } catch (error) {
      console.error('❌ Error submitting payment:', error);

      if (error.response?.data?.error?.message) {
        alert(`Gagal mengirim pembayaran: ${error.response.data.error.message}`);
      } else {
        alert('Gagal mengirim pembayaran. Silakan coba lagi.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!selectedPlan) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-lg font-semibold font-bold text-gray-900 font-montserrat mb-4">
            Paket tidak ditemukan
          </h1>
          <AnimatedButton
            onClick={() => navigate(-1)}
            className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-montserrat"
          >
            Kembali ke Pilihan Paket
          </AnimatedButton>
        </div>
      </div>
    );
  }

  const selectedBank = bankAccounts[paymentMethod];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-lg font-semibold font-bold text-gray-900 font-montserrat mb-2">
            {isSuspended ? '🔄 Checkout Reaktivasi' : '💳 Checkout Pembayaran'}
          </h1>
          <p className="text-sm text-gray-600 font-montserrat">
            {isSuspended 
              ? `Reaktivasi akun dengan paket ${selectedPlan.name}`
              : `Paket ${selectedPlan.name}`
            }
          </p>
          {isSuspended && (
            <div className="mt-2 p-2 bg-orange-100 border border-orange-300 rounded-lg">
              <p className="text-orange-800 text-xs font-montserrat">
                <FaRedo className="inline mr-1" />
                Akun Anda akan diaktifkan kembali setelah pembayaran diverifikasi
              </p>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Order Summary */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
            <h2 className="text-lg font-bold text-gray-800 font-montserrat mb-4">
              📋 Ringkasan Pesanan
            </h2>

            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-blue-50 rounded-xl">
                <div>
                  <h3 className="text-base font-bold text-gray-900 font-montserrat">
                    {selectedPlan.name}
                  </h3>
                  <p className="text-sm text-gray-600 font-montserrat">
                    {selectedPlan.description}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-xl font-bold text-blue-600 font-montserrat">
                    {new Intl.NumberFormat('id-ID', {
                      style: 'currency',
                      currency: 'IDR',
                      minimumFractionDigits: 0
                    }).format(parseFloat(selectedPlan.price))}
                  </div>
                  <div className="text-xs text-gray-500 font-montserrat">
                    per {selectedPlan.duration_days} hari
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm font-montserrat">
                  <span className="text-gray-600">Max Cabang:</span>
                  <span className="text-gray-900 font-bold">
                    {selectedPlan.max_branches === 999 ? 'Unlimited' : selectedPlan.max_branches}
                  </span>
                </div>
                <div className="flex justify-between text-sm font-montserrat">
                  <span className="text-gray-600">Max User:</span>
                  <span className="text-gray-900 font-bold">
                    {selectedPlan.max_users === 999 ? 'Unlimited' : selectedPlan.max_users}
                  </span>
                </div>
              </div>

              {/* Features */}
              {selectedPlan.features && (
                <div>
                  <h4 className="text-sm font-bold text-gray-700 font-montserrat mb-2">
                    ✨ Fitur Tersedia:
                  </h4>
                  <div className="grid grid-cols-2 gap-1">
                    {Object.entries(selectedPlan.features).map(([key, value]) => (
                      value && (
                        <div key={key} className="flex items-center text-xs text-gray-600 font-montserrat">
                          <span className="text-green-500 mr-1">✓</span>
                          {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </div>
                      )
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Payment Details */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
            <h2 className="text-lg font-bold text-gray-800 font-montserrat mb-4">
              💳 Detail Pembayaran
            </h2>

            {/* Payment Method Selection */}
            <div className="mb-4">
              <h3 className="text-sm font-bold text-gray-700 font-montserrat mb-3">
                Pilih Bank Tujuan
              </h3>
              <div className="space-y-3">
                {Object.entries(bankAccounts).map(([key, bank]) => (
                  <div
                    key={key}
                    className={`border-2 rounded-xl p-4 cursor-pointer transition-all duration-200 ${paymentMethod === key
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-blue-300'
                      }`}
                    onClick={() => setPaymentMethod(key)}
                  >
                    <div className="flex items-center">
                      <span className="text-lg font-semibold mr-3">{bank.logo}</span>
                      <div>
                        <h4 className="font-bold text-gray-900 font-montserrat">
                          Bank {bank.name}
                        </h4>
                        <p className="text-gray-600 font-montserrat">
                          {bank.accountNumber}
                        </p>
                      </div>
                      {paymentMethod === key && (
                        <FaCheckCircle className="text-blue-500 ml-auto text-xl" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Bank Account Details */}
            <div className="mb-4">
              <h3 className="text-sm font-bold text-gray-700 font-montserrat mb-3">
                Rekening Tujuan
              </h3>
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 font-montserrat">Bank:</span>
                    <span className="font-bold text-gray-900 font-montserrat text-sm">
                      {selectedBank.logo} {selectedBank.name}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 font-montserrat">No. Rekening:</span>
                    <span className="font-bold text-gray-900 font-montserrat font-mono text-sm">
                      {selectedBank.accountNumber}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 font-montserrat">Atas Nama:</span>
                    <span className="font-bold text-gray-900 font-montserrat text-sm">
                      {selectedBank.accountHolder}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 font-montserrat">Jumlah:</span>
                    <span className="font-bold text-blue-600 font-montserrat text-base">
                      {new Intl.NumberFormat('id-ID', {
                        style: 'currency',
                        currency: 'IDR',
                        minimumFractionDigits: 0
                      }).format(parseFloat(selectedPlan.price))}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Code */}
            <div className="mb-4">
              <h3 className="text-base font-bold text-gray-700 font-montserrat mb-3">
                Kode Pembayaran Unik
              </h3>

              <div className="bg-gradient-to-r from-blue-50 to-blue-100 border-2 border-blue-200 rounded-xl p-4 text-center">
                <div className="text-4xl font-bold text-blue-600 font-mono mb-2">
                  {paymentCode || 'Generating...'}
                </div>
                <div className="text-sm text-blue-700 font-montserrat mb-3">
                  Gunakan kode ini sebagai berita acara/keterangan saat transfer
                </div>
                <div className="text-xs text-blue-600 font-montserrat">
                  💡 Kode unik (100-500) berdasarkan nominal pembayaran
                </div>
              </div>

              <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="text-sm text-yellow-800 font-montserrat">
                  <strong>Cara Transfer:</strong>
                  <ol className="list-decimal list-inside mt-1 space-y-1">
                    <li>Transfer ke rekening tujuan di atas</li>
                    <li>Masukkan kode <strong>{paymentCode}</strong> sebagai berita acara</li>
                    <li>Klik tombol "Konfirmasi Pembayaran" di bawah</li>
                    <li>Tunggu verifikasi maksimal 1x24 jam</li>
                  </ol>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <AnimatedButton
                onClick={handleSubmitPayment}
                disabled={!paymentCode || isSubmitting}
                className={`w-full py-3 px-4 rounded-lg font-bold font-montserrat text-base ${!paymentCode || isSubmitting
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700'
                  }`}
              >
                {isSubmitting 
                  ? (isSuspended ? '🔄 Memproses Reaktivasi...' : '⏳ Memproses...')
                  : (isSuspended ? '🔄 Konfirmasi Reaktivasi' : '✅ Konfirmasi Pembayaran')
                }
              </AnimatedButton>

              <AnimatedButton
                onClick={() => navigate(-1)}
                className="w-full py-2 px-4 rounded-lg font-bold font-montserrat text-base bg-gray-100 text-gray-700 hover:bg-gray-200"
              >
                <FaArrowLeft className="inline mr-2" />
                Kembali ke Pilihan Paket
              </AnimatedButton>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
