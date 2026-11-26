import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import HeaderBilling from '../../components/Com Header/HeaderBilling';
import StatusAlert from './components/StatusAlert';
import { BillingCard, BillingDetailModal } from '../../components/Billing';
import PaymentModal from './components/PaymentModal';
import ChangePlanModal from './components/ChangePlanModal';
import LoginModal from './components/LoginModal';
import TripayPaymentModal from './components/TripayPaymentModal';
import { inactiveBillingService } from './services/inactiveBillingService';
import { getPhoneDisplayData } from '../../utils/labelFormatter';
import {
  AlertCircle,
  CreditCard,
  RefreshCw,
  Settings,
  Phone,
  CheckCircle,
  LogIn
} from 'lucide-react';

const InactiveBillingPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [billingData, setBillingData] = useState({
    tenantInfo: null,
    unpaidBills: [],
    pendingBills: [],
    availablePlans: [],
    error: null
  });

  // Track tenant status for different UI
  const [tenantStatus, setTenantStatus] = useState(null);

  // Modal states
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showChangePlanModal, setShowChangePlanModal] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showTripayModal, setShowTripayModal] = useState(false);
  const [showBillingDetailModal, setShowBillingDetailModal] = useState(false);
  const [detailBilling, setDetailBilling] = useState(null);
  const [selectedBilling, setSelectedBilling] = useState(null);

  // Check encrypted data dan fetch data saat component mount
  useEffect(() => {
    // Check if encrypted data exists
    if (!inactiveBillingService.isAuthenticated()) {
      console.log('🔒 No encrypted data found, redirecting to login');
      navigate('/login');
      return;
    }

    fetchData();
  }, [navigate]);

  // Update detailBilling when billingData changes (after payment method change)
  useEffect(() => {
    if (detailBilling && (billingData.unpaidBills.length > 0 || billingData.pendingBills.length > 0)) {
      const allBills = [...billingData.unpaidBills, ...billingData.pendingBills];
      const updatedBilling = allBills.find(b => b.id === detailBilling.id);
      if (updatedBilling) {
        console.log('🔄 Updating detailBilling from', detailBilling.status, 'to', updatedBilling.status);
        setDetailBilling(updatedBilling);
      }
    }
  }, [billingData]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [tenantStatus, billingStatus, plans] = await Promise.all([
        inactiveBillingService.getTenantStatus(),
        inactiveBillingService.getBillingStatus(),
        inactiveBillingService.getSubscriptionPlans()
      ]);

      const unpaidBills = billingStatus.data.pending_billings || [];
      const pendingBills = unpaidBills.filter(bill => bill.status === 'pending');

      console.log('🔍 InactiveBillingPage.fetchData - Raw data:', {
        unpaidBills: unpaidBills,
        pendingBills: pendingBills,
        billingStatus: billingStatus.data
      });

      setBillingData({
        tenantInfo: tenantStatus.data,
        unpaidBills: unpaidBills,
        pendingBills: pendingBills,
        availablePlans: plans.data || [],
        error: null
      });

      // Set tenant status for different UI
      setTenantStatus(tenantStatus.data.tenant?.status);

      // Auto-open ChangePlanModal for trial expired
      if (tenantStatus.data.tenant?.status === 'expired' &&
        tenantStatus.data.tenant?.subscription_status === 'expired' &&
        !tenantStatus.data.subscription) {
        setShowChangePlanModal(true);
      }
    } catch (error) {
      console.error('Error fetching data:', error);

      // Check if it's authentication error
      if (error.response?.status === 401 || error.response?.status === 403) {
        console.log('🔒 Authentication failed, redirecting to login');
        inactiveBillingService.logout();
        navigate('/login');
        return;
      }

      setBillingData(prev => ({
        ...prev,
        error: 'Gagal memuat data. Silakan coba lagi.'
      }));
    } finally {
      setLoading(false);
    }
  };

  const handlePayBilling = (billing) => {
    setSelectedBilling(billing);
    setShowPaymentModal(true);
  };

  const handleTripayPayment = (billing) => {
    setSelectedBilling(billing);
    setShowTripayModal(true);
  };

  const handleChangePlan = () => {
    setShowChangePlanModal(true);
  };

  const handleCheckStatus = () => {
    setShowLoginModal(true);
  };

  const handlePaymentSuccess = () => {
    setShowPaymentModal(false);
    setSelectedBilling(null);
    fetchData(); // Refresh data
  };

  const handleTripaySuccess = () => {
    setShowTripayModal(false);
    setSelectedBilling(null);
    // Force refresh with loading state
    setLoading(true);
    fetchData(); // Refresh data
  };

  // NEW: Handle billing detail
  const handleBillingDetail = (billing) => {
    setDetailBilling(billing);
    setShowBillingDetailModal(true);
  };

  // NEW: Handle refresh status
  const handleRefreshStatus = async (billing) => {
    try {
      await handleCheckPayment(billing);
      // Close modal after refresh
      setShowBillingDetailModal(false);
      setDetailBilling(null);
    } catch (error) {
      console.error('Error refreshing status:', error);
    }
  };

  // NEW: Handle check payment
  const handleCheckPayment = async (billing) => {
    try {
      console.log('🔍 InactiveBillingPage.handleCheckPayment - Checking billing:', billing.id);

      // Use manualCheckStatus to hit Tripay API
      const response = await inactiveBillingService.manualCheckStatus(billing.id);

      if (response.success) {
        const { tripay_status, new_status, updated } = response.data;
        console.log('✅ InactiveBillingPage.handleCheckPayment - Tripay status:', tripay_status, 'New status:', new_status, 'Updated:', updated);

        // Show status message to user
        if (tripay_status === 'PAID') {
          alert('Pembayaran berhasil! Status telah diupdate.');
        } else if (tripay_status === 'FAILED' || tripay_status === 'CANCELLED') {
          alert('Pembayaran gagal atau dibatalkan. Silakan coba lagi.');
        } else {
          alert(`Status pembayaran: ${tripay_status}`);
        }

        // Refresh data after status check
        await fetchData();
      } else {
        throw new Error(response.message || 'Failed to check payment status');
      }
    } catch (error) {
      console.error('Error checking payment status:', error);
      alert('Gagal memeriksa status pembayaran. Silakan coba lagi.');
    }
  };

  // NEW: Handle tripay payment success from BillingDetailModal
  const handleTripayPaymentSuccess = async (billing) => {
    try {
      // Refresh data to get updated billing information
      await fetchData();

      // Update detail billing with fresh data
      if (detailBilling && detailBilling.id === billing.id) {
        const allBills = [...billingData.unpaidBills, ...billingData.pendingBills];
        const updatedBilling = allBills.find(b => b.id === billing.id);
        if (updatedBilling) {
          setDetailBilling(updatedBilling);
        }
      }
    } catch (error) {
      console.error('Error refreshing data after payment:', error);
    }
  };

  const handlePlanChangeSuccess = () => {
    setShowChangePlanModal(false);
    fetchData(); // Refresh data
  };

  if (loading) {
    return (
      <div className="h-[100dvh] flex flex-col overflow-hidden font-montserrat">
        <HeaderBilling
          title="Billing & Payment"
          description="Kelola Pembayaran"
        />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
            <p className="text-gray-600">Memuat data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[100dvh] flex flex-col overflow-hidden font-montserrat">
      <HeaderBilling
        title="Billing & Payment"
        description="Kelola Pembayaran"
      />

      <div className="flex-1 overflow-y-auto bg-gray-50">
        <div className="max-w-[390px] md:max-w-4xl mx-auto py-4 space-y-6">

          {/* Status Alert - Akun Suspended */}
          <StatusAlert
            tenantInfo={billingData.tenantInfo}
            tenantStatus={tenantStatus}
            onRefresh={fetchData}
            onChangePlan={handleChangePlan}
          />

          {/* Error Message */}
          {billingData.error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <div className="flex items-center space-x-2">
                <AlertCircle className="w-5 h-5 text-red-500" />
                <p className="text-red-700 font-medium">{billingData.error}</p>
              </div>
              <button
                onClick={fetchData}
                className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
              >
                Coba lagi
              </button>
            </div>
          )}

          {/* Tenant Active Success Message */}
          {billingData.tenantInfo?.tenant?.status === 'active' &&
            billingData.tenantInfo?.tenant?.subscription_status === 'active' &&
            billingData.unpaidBills.length === 0 &&
            billingData.pendingBills.length === 0 && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
                <div className="flex flex-col items-center space-y-4">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-8 h-8 text-green-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-green-800 mb-2">
                      Akun Anda Sudah Aktif!
                    </h3>
                    <p className="text-green-700 mb-4">
                      Pembayaran berhasil diverifikasi. Anda sekarang dapat mengakses semua fitur NotaSepatu.
                    </p>
                    <button
                      onClick={() => navigate('/login')}
                      className="bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-6 rounded-lg transition-colors flex items-center space-x-2 mx-auto"
                    >
                      <LogIn className="w-4 h-4" />
                      <span>Login ke Dashboard</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

          {/* Billing List - Tagihan Unpaid */}
          <div className="space-y-4">
            {billingData.unpaidBills.map((billing) => (
              <BillingCard
                key={billing.id}
                billing={billing}
                onDetail={handleBillingDetail}
                onTripayPayment={handleTripayPayment}
                onCheckPayment={handleCheckPayment}
                generatingCode={false}
              />
            ))}
            {billingData.pendingBills.map((billing) => (
              <BillingCard
                key={billing.id}
                billing={billing}
                onDetail={handleBillingDetail}
                onTripayPayment={handleTripayPayment}
                onCheckPayment={handleCheckPayment}
                generatingCode={false}
              />
            ))}
          </div>


          {/* Support Contact */}
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <Phone className="w-5 h-5 text-green-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-gray-800">Butuh Bantuan?</h3>
                <p className="text-sm text-gray-600">Hubungi support kami jika ada masalah</p>
                <a
                  href={getPhoneDisplayData('6287778942773', 'Halo, saya butuh bantuan terkait billing NotaSepatu').whatsappLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center space-x-1 text-sm text-green-600 hover:text-green-700 font-medium mt-1"
                >
                  <Phone className="w-3 h-3" />
                  <span>{getPhoneDisplayData('6287778942773').display}</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {showPaymentModal && selectedBilling && (
        <PaymentModal
          billing={selectedBilling}
          onClose={() => setShowPaymentModal(false)}
          onSuccess={handlePaymentSuccess}
        />
      )}

      {showChangePlanModal && (
        <ChangePlanModal
          currentPlan={billingData.tenantInfo?.subscription?.plan}
          availablePlans={billingData.availablePlans}
          unpaidBills={billingData.unpaidBills}
          tenantStatus={tenantStatus}
          onClose={() => setShowChangePlanModal(false)}
          onSuccess={handlePlanChangeSuccess}
        />
      )}

      {showLoginModal && (
        <LoginModal
          onClose={() => setShowLoginModal(false)}
          onSuccess={() => {
            setShowLoginModal(false);
            fetchData();
          }}
          pendingBills={billingData.pendingBills}
        />
      )}

      {showTripayModal && selectedBilling && (
        <TripayPaymentModal
          billing={selectedBilling}
          onClose={() => setShowTripayModal(false)}
          onCloseCallback={() => {
            // Trigger fetch ulang data saat modal ditutup
            fetchData();
          }}
          onSuccess={handleTripaySuccess}
          isActiveTenant={false}
        />
      )}

      {/* Billing Detail Modal */}
      <BillingDetailModal
        isOpen={showBillingDetailModal}
        onClose={() => {
          setShowBillingDetailModal(false);
          setDetailBilling(null);
        }}
        billing={detailBilling}
        onTripayPayment={handleTripayPaymentSuccess}
        onCheckPayment={handleCheckPayment}
        onRefreshStatus={handleRefreshStatus}
        generatingCode={false}
        isConfirmingPayment={false}
        isActiveTenant={false}
      />

    </div>
  );
};

export default InactiveBillingPage;
