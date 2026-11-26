import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import HeaderBilling from '../../components/Com Header/HeaderBilling';
import BillingCard from '../../components/Billing/BillingCard';
import BillingDetailModal from '../../components/Billing/BillingDetailModal';
import TripayPaymentModal from '../INACTIVEBILLING/components/TripayPaymentModal';
import api from '../../config/api';
import activeTenantPaymentService from './services/activeTenantPaymentService';
import { getUserProfile } from '../../utils/userProfileHelper';
import {
  CreditCard,
  Calendar,
  DollarSign,
  Clock,
  CheckCircle,
  X,
  AlertCircle,
  RefreshCw,
  ArrowRight,
  Zap
} from 'lucide-react';

const BillingActiveTenantPayment = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [tenantId, setTenantId] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tenantInfo, setTenantInfo] = useState(null);
  const [subscriptionData, setSubscriptionData] = useState(null);
  const [isTenantActive, setIsTenantActive] = useState(null);
  const [upcomingBillings, setUpcomingBillings] = useState([]);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedBilling, setSelectedBilling] = useState(null);
  const [isConfirmingPayment, setIsConfirmingPayment] = useState(false);
  const [showChangePlanModal, setShowChangePlanModal] = useState(false);
  const [subscriptionPlans, setSubscriptionPlans] = useState([]);
  const [selectedDuration, setSelectedDuration] = useState(30); // default 1 bulan
  const [generatingCode, setGeneratingCode] = useState(false);
  const [error, setError] = useState(null);
  const [selectedBank, setSelectedBank] = useState('BCA');
  const [showTripayModal, setShowTripayModal] = useState(false);
  const [paymentChannels, setPaymentChannels] = useState([]);
  const [selectedChannel, setSelectedChannel] = useState(null);
  const [tripayTransaction, setTripayTransaction] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState('pending');
  const [statusPolling, setStatusPolling] = useState(null);
  const [showBillingDetailModal, setShowBillingDetailModal] = useState(false);
  const [detailBilling, setDetailBilling] = useState(null);
  const [availablePlans, setAvailablePlans] = useState([]);
  const [checkoutLoadingPlanId, setCheckoutLoadingPlanId] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [confirmPayment, setConfirmPayment] = useState({ show: false, url: '', label: '' });

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  // Bank accounts data
  const bankAccounts = {
    'BCA': {
      name: 'BCA',
      accountNumber: '1234567890',
      accountHolder: 'PT. NotaSepatu'
    },
    'Mandiri': {
      name: 'Mandiri',
      accountNumber: '9876543210',
      accountHolder: 'PT. NotaSepatu'
    }
  };

  // Load tenant ID from location state or user profile
  useEffect(() => {
    const loadTenantId = async () => {
      try {
        // First try to get from location state (passed from parent)
        if (location.state?.tenantId) {
          setTenantId(location.state.tenantId);
          setUserProfile(location.state.userProfile);
          console.log('✅ BillingActiveTenantPayment - Tenant ID from location state:', location.state.tenantId);
        } else {
          // Fallback to getUserProfile
          const profile = await getUserProfile();
          if (profile?.tenant?.id) {
            setTenantId(profile.tenant.id);
            setUserProfile(profile);
            console.log('✅ BillingActiveTenantPayment - Tenant ID from profile:', profile.tenant.id);
          } else {
            console.warn('⚠️ BillingActiveTenantPayment - No tenant ID found');
          }
        }
      } catch (error) {
        console.error('❌ BillingActiveTenantPayment - Failed to load tenant ID:', error);
      }
    };

    loadTenantId();
  }, [location.state]);

  // Fetch subscription status
  const fetchSubscriptionStatus = useCallback(async () => {
    if (!tenantId) return;

    try {
      const response = await api.get(`/active-tenant-payment/status/${tenantId}`);
      if (response.data.success) {
        setTenantInfo(response.data.data.tenant);
        setSubscriptionData(response.data.data.subscription);
        setIsTenantActive(response.data.data.tenant.status);
      }
    } catch (error) {
      console.error('Error fetching subscription status:', error);
    }
  }, [tenantId]);

  // Fetch upcoming billings
  const fetchUpcomingBillings = useCallback(async () => {
    if (!tenantId) return;

    try {
      const response = await api.get(`/active-tenant-payment/upcoming/${tenantId}`);
      if (response.data.success) {
        setUpcomingBillings(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching upcoming billings:', error);
    }
  }, [tenantId]);

  const fetchSubscriptionPlans = useCallback(async () => {
    try {
      const response = await api.get('/active-tenant-plan/available-plans');
      if (response.data.success) {
        setSubscriptionPlans(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching subscription plans:', error);
    }
  }, []);

  // NEW: Fetch direct checkout plans
  const fetchAvailablePlans = useCallback(async () => {
    try {
      const response = await api.get('/subscription-plans/available');
      if (response.data.success) {
        setAvailablePlans(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching available plans:', error);
    }
  }, []);

  // Fetch all data
  const fetchData = useCallback(async () => {
    if (!tenantId) return;

    setLoading(true);
    try {
      await Promise.all([
        fetchSubscriptionStatus(),
        fetchUpcomingBillings(),
        fetchSubscriptionPlans(),
        fetchAvailablePlans()
      ]);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }, [tenantId, fetchSubscriptionStatus, fetchUpcomingBillings, fetchSubscriptionPlans]);

  useEffect(() => {
    if (tenantId) {
      fetchData();
    }
  }, [tenantId, fetchData]);

  // Update detailBilling when upcomingBillings changes (after payment method change)
  useEffect(() => {
    if (detailBilling && upcomingBillings.length > 0) {
      const updatedBilling = upcomingBillings.find(b => b.id === detailBilling.id);
      if (updatedBilling) {
        console.log('🔄 Updating detailBilling from', detailBilling.status, 'to', updatedBilling.status);
        setDetailBilling(updatedBilling);
      }
    }
  }, [upcomingBillings]);

  // Set tab based on selected plan when modal opens
  useEffect(() => {
    if (showChangePlanModal && subscriptionPlans.length > 0) {
      const currentPlan = subscriptionPlans.find(p => p.id === subscriptionData?.plan?.id);

      if (currentPlan) {
        // If NotaFree, set to Gratis tab
        if (currentPlan.id === 4 || currentPlan.price === 0 || currentPlan.duration_days === 9999) {
          setSelectedDuration(null); // Gratis tab
        } else {
          // Set to the duration tab of the selected plan
          setSelectedDuration(currentPlan.duration_days);
        }
      } else {
        // No plan selected yet, default to Gratis tab
        setSelectedDuration(null);
      }
    }
  }, [showChangePlanModal, subscriptionData?.plan?.id, subscriptionPlans]);

  const getFilteredPlans = () => {
    if (!availablePlans || availablePlans.length === 0) return [];
    if (selectedDuration === null) {
      return availablePlans.filter(p =>
        p.duration_days === 9999 || p.name === 'NotaFree' || p.id === 4
      );
    }
    return availablePlans.filter(p => {
      if (p.duration_days === 9999 || p.id === 4 || p.name === 'NotaFree') return false;
      return p.duration_days === selectedDuration;
    });
  };

  const getDiscountInfo = (plan) => {
    if (plan.duration_days === 30) return null;
    const monthlyPlan = availablePlans?.find(
      p => p.name === plan.name && p.duration_days === 30
    );
    if (!monthlyPlan) return null;
    const monthlyPrice = parseFloat(monthlyPlan.price);
    const totalMonthlyPrice = monthlyPrice * (plan.duration_days / 30);
    const saved = totalMonthlyPrice - parseFloat(plan.price);
    const discount = plan.duration_days === 90 ? 20 : plan.duration_days === 365 ? 50
      : Math.round((saved / totalMonthlyPrice) * 100);
    return {
      discount,
      saved: Math.round(saved),
      originalPrice: Math.round(totalMonthlyPrice),
    };
  };

  const getMonthlyPrice = (plan) => {
    if (!plan.price || plan.duration_days === 9999) return 0;
    return Math.round(parseFloat(plan.price) / (plan.duration_days / 30));
  };

  const getDurationLabel = (days) => {
    if (days === 30) return '1 Bulan';
    if (days === 90) return '3 Bulan';
    if (days === 365) return '1 Tahun';
    return `${days} hari`;
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const handlePayment = async (billing) => {
    setGeneratingCode(true);
    setError(null);

    // ✅ Check if billing is expired or cancelled
    const isExpired = billing?.expired_at && new Date(billing.expired_at) < new Date();

    if (billing.status === 'cancelled') {
      setGeneratingCode(false);
      alert('Billing ini sudah dibatalkan karena expired. Silakan hubungi admin untuk membuat billing baru.');
      return;
    }

    if (isExpired && billing?.payment_reference) {
      setGeneratingCode(false);
      alert('Transaksi pembayaran sebelumnya sudah expired. Silakan buat transaksi baru via Tripay atau hubungi admin.');
      return;
    }

    try {
      // Generate payment code first
      const response = await activeTenantPaymentService.generatePaymentCode(billing.id);

      if (response.success) {
        // Update billing object with payment code and final amount
        const updatedBilling = {
          ...billing,
          payment_code: response.data.payment_code,
          final_amount: response.data.final_amount,
          formatted_amount: response.data.formatted_amount,
          original_amount: response.data.original_amount
        };

        setSelectedBilling(updatedBilling);
        setShowPaymentModal(true);
      } else {
        throw new Error(response.message || 'Failed to generate payment code');
      }
    } catch (error) {
      console.error('Error generating payment code:', error);
      setError('Gagal membuat kode pembayaran. Silakan coba lagi.');
    } finally {
      setGeneratingCode(false);
    }
  };

  // NEW: One-shot direct checkout
  const handleDirectCheckout = async (planId) => {
    console.log('[CHECKOUT] handleDirectCheckout called with planId:', planId);
    try {
      setCheckoutLoadingPlanId(planId);
      setError(null);
      console.log('[CHECKOUT] Sending API request...');
      const response = await api.post('/billing/checkout', {
        plan_id: planId,
        payment_method: 'QRIS2',
      });
      console.log('[CHECKOUT] API response:', response);
      console.log('[CHECKOUT] response.data:', response.data);
      console.log('[CHECKOUT] response.data.success:', response.data?.success);
      if (response.data.success) {
        const { checkout_url } = response.data.data;
        console.log('[CHECKOUT] Success, checkout_url:', checkout_url);
        // Show confirmation modal instead of auto-redirect
        setConfirmPayment({
          show: true,
          url: checkout_url,
          label: 'Bayar Sekarang'
        });
      } else {
        throw new Error(response.data.message || 'Failed to create checkout');
      }
    } catch (error) {
      console.error('[CHECKOUT] Error:', error);
      console.error('[CHECKOUT] Error response:', error.response?.data);
      setError('Gagal membuat pembayaran. Silakan coba lagi.');
      alert('Gagal membuat pembayaran: ' + (error.response?.data?.message || error.message));
    } finally {
      setCheckoutLoadingPlanId(null);
    }
  };

  // NEW: Handle Tripay payment
  const handleTripayPayment = async (billing) => {
    setError(null);

    // ✅ Check if billing is expired
    const isExpired = billing?.expired_at && new Date(billing.expired_at) < new Date();
    const hasTransaction = billing?.payment_reference && billing?.payment_url;

    // If billing has expired transaction, show warning and proceed to create new transaction
    if (hasTransaction && isExpired) {
      const confirmCreate = window.confirm(
        'Transaksi sebelumnya sudah expired. Apakah Anda ingin membuat transaksi pembayaran baru?'
      );

      if (!confirmCreate) {
        return;
      }
    }

    // ✅ Check if billing status is cancelled (expired billing from backend)
    if (billing.status === 'cancelled') {
      const confirmCreate = window.confirm(
        'Billing ini sudah dibatalkan karena expired. Apakah Anda ingin membuat transaksi pembayaran baru?'
      );

      if (!confirmCreate) {
        return;
      }
    }

    setSelectedBilling(billing);

    try {
      // Fetch payment channels first
      const channelsResponse = await api.get('/tripay/channels');
      if (channelsResponse.data.success) {
        setPaymentChannels(channelsResponse.data.data);
        setShowTripayModal(true);
      } else {
        throw new Error('Failed to load payment channels');
      }
    } catch (error) {
      console.error('Error loading payment channels:', error);
      setError('Gagal memuat metode pembayaran. Silakan coba lagi.');
    }
  };

  // NEW: Handle Tripay payment success (called from BillingDetailModal)
  const handleTripayPaymentSuccess = async (billing) => {
    try {
      // Refresh data to get updated billing information
      await fetchData();

      // Note: detailBilling will be updated via useEffect when upcomingBillings changes
    } catch (error) {
      console.error('Error refreshing data after payment:', error);
    }
  };

  // NEW: Create Tripay transaction
  const handleCreateTripayTransaction = async () => {
    if (!selectedChannel || !selectedBilling) return;

    try {
      const response = await api.post('/tripay/create-transaction', {
        billing_id: selectedBilling.id,
        payment_method: selectedChannel.code
      });

      if (response.data.success) {
        setTripayTransaction(response.data.data);
        setPaymentStatus('pending');
        startStatusPolling(response.data.data.reference);
      } else {
        throw new Error(response.data.message || 'Failed to create transaction');
      }
    } catch (error) {
      console.error('Error creating Tripay transaction:', error);
      setError('Gagal membuat transaksi. Silakan coba lagi.');
    }
  };

  // NEW: Start status polling
  const startStatusPolling = (reference) => {
    const pollInterval = setInterval(async () => {
      try {
        // Use check-status endpoint to update database
        const response = await api.post(`/tripay/check-status/${selectedBilling.id}`);
        if (response.data.success) {
          const { tripay_status, new_status, updated } = response.data.data;
          setPaymentStatus(tripay_status);

          if (tripay_status === 'PAID') {
            clearInterval(pollInterval);
            setStatusPolling(null);
            // Refresh data and close modal
            await fetchData();
            setShowTripayModal(false);
            setSelectedBilling(null);
            setTripayTransaction(null);
            alert('Pembayaran berhasil! Status billing telah diperbarui.');
          } else if (tripay_status === 'FAILED' || tripay_status === 'CANCELLED') {
            clearInterval(pollInterval);
            setStatusPolling(null);
            setError('Pembayaran gagal atau dibatalkan. Silakan coba lagi.');
          }
        }
      } catch (error) {
        console.error('Error checking payment status:', error);
      }
    }, 5000); // Poll every 5 seconds

    setStatusPolling(pollInterval);
  };

  // NEW: Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (statusPolling) {
        clearInterval(statusPolling);
      }
    };
  }, [statusPolling]);

  const handleCheckPayment = async (billing) => {
    try {
      // Call API to check specific payment status
      const response = await api.get(`/active-tenant-payment/check-payment/1/${billing.id}`);

      if (response.data.success) {
        const { billing: updatedBilling, message, needs_action } = response.data.data;

        // Show status message to user
        alert(message);

        // If status changed, refresh all data
        if (updatedBilling.status !== billing.status) {
          await fetchData();
        }
      } else {
        throw new Error(response.data.message || 'Failed to check payment status');
      }
    } catch (error) {
      console.error('Error checking payment status:', error);
      alert('Gagal memeriksa status pembayaran. Silakan coba lagi.');
    }
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

  // NEW: Handle Tripay success
  const handleTripaySuccess = () => {
    setShowTripayModal(false);
    setSelectedBilling(null);
    setSelectedChannel(null);
    setTripayTransaction(null);
    setPaymentStatus('pending');
    if (statusPolling) {
      clearInterval(statusPolling);
      setStatusPolling(null);
    }
    // Refresh data
    fetchData();
  };

  const handleSelectPlan = async (plan) => {
    try {
      // Find existing unpaid/pending billing
      const existingBilling = upcomingBillings.find(billing =>
        billing.status === 'unpaid' || billing.status === 'pending'
      );

      if (existingBilling) {
        // Update existing billing
        const response = await api.post('/active-tenant-plan/change-plan', {
          tenant_id: tenantId,
          plan_id: plan.id,
          billing_id: existingBilling.id
        });

        if (response.data.success) {
          const { current_plan, selected_plan, price_difference, action, strategy, auto_completed, message } = response.data.data;

          // ✅ Check if auto-completed (downgrade to NotaFree)
          if (auto_completed) {
            alert(message || 'Paket berhasil diubah ke NotaFree!');
            setShowChangePlanModal(false);
            await fetchData();
            // Redirect to login for fresh data
            window.location.href = '/login';
            return;
          }

          // Show confirmation dialog for paid plans
          const confirmMessage = `Ubah paket dari ${current_plan.name} (Rp ${parseInt(current_plan.price).toLocaleString()}) ke ${selected_plan.name} (Rp ${parseInt(selected_plan.price).toLocaleString()})?`;

          if (window.confirm(confirmMessage)) {
            // The API already handled the billing update/create
            alert('Paket berhasil diubah! Silakan lakukan pembayaran.');
            setShowChangePlanModal(false);
            await fetchData();
          }
        }
      } else {
        // Create new billing
        const response = await api.post('/active-tenant-plan/change-plan', {
          tenant_id: tenantId,
          plan_id: plan.id
        });

        if (response.data.success) {
          const { current_plan, selected_plan, price_difference, action, strategy, auto_completed, message } = response.data.data;

          // ✅ Check if auto-completed (downgrade to NotaFree)
          if (auto_completed) {
            alert(message || 'Paket berhasil diubah ke NotaFree!');
            setShowChangePlanModal(false);
            await fetchData();
            // Redirect to login for fresh data
            window.location.href = '/login';
            return;
          }

          // Show confirmation dialog for paid plans
          const confirmMessage = `Ubah paket dari ${current_plan.name} (Rp ${parseInt(current_plan.price).toLocaleString()}) ke ${selected_plan.name} (Rp ${parseInt(selected_plan.price).toLocaleString()})?`;

          if (window.confirm(confirmMessage)) {
            // The API already handled the billing update/create
            alert('Paket berhasil diubah! Silakan lakukan pembayaran.');
            setShowChangePlanModal(false);
            await fetchData();
          }
        }
      }
    } catch (error) {
      console.error('Error changing plan:', error);
      alert('Gagal mengubah paket. Silakan coba lagi.');
    }
  };

  const handleConfirmPayment = async () => {
    if (!selectedBilling) return;

    setIsConfirmingPayment(true);
    try {
      const selectedBankData = bankAccounts[selectedBank];

      // Call API to submit payment
      const response = await activeTenantPaymentService.submitPayment({
        billing_id: selectedBilling.id,
        payment_method: 'manual_bank_transfer',
        bank_name: selectedBankData.name,
        account_number: selectedBankData.accountNumber,
        account_holder: selectedBankData.accountHolder,
        amount: selectedBilling.final_amount || selectedBilling.amount,
        payment_code: selectedBilling.payment_code,
        notes: `Manual payment confirmation for invoice ${selectedBilling.invoice_number} via ${selectedBankData.name}`
      });

      if (response.success) {
        // Refresh data
        await fetchData();

        setShowPaymentModal(false);
        setSelectedBilling(null);
        setError(null);
        setSelectedBank('BCA'); // Reset to default

        // Show success message
        alert('Pembayaran berhasil dikonfirmasi! Admin akan memverifikasi pembayaran Anda.');
      } else {
        throw new Error(response.message || 'Failed to submit payment');
      }
    } catch (error) {
      console.error('Error confirming payment:', error);
      alert('Terjadi kesalahan saat mengkonfirmasi pembayaran. Silakan coba lagi.');
    } finally {
      setIsConfirmingPayment(false);
    }
  };


  if (loading) {
    return (
      <div className="h-[100dvh] flex flex-col overflow-hidden font-montserrat">
        <HeaderBilling
          title="Billing & Payment"
          description="Kelola Pembayaran"
          onBack={() => navigate(-1)}
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
        onBack={() => navigate(-1)}
      />

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-[390px] md:max-w-4xl mx-auto p-4 md:p-6 space-y-6">

          {/* Subscription Status */}
          {subscriptionData && (
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-800">Status Langganan</h2>
                <div className={`px-3 py-1 rounded-full text-sm font-medium ${isTenantActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {isTenantActive.toUpperCase()}
                </div>
              </div>

              {subscriptionData && (
                <>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Paket</span>
                      <span className="font-semibold text-gray-800">{subscriptionData.plan?.name || 'Tidak ada'}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Harga</span>
                      <span className="font-semibold text-gray-800">
                        {subscriptionData.plan?.price === 0 || subscriptionData.plan?.id === 4
                          ? 'Gratis'
                          : formatCurrency(subscriptionData.plan?.price || 0)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Berakhir</span>
                      <span className="font-semibold text-gray-800">
                        {(() => {
                          // Check if NotaFree plan
                          if (subscriptionData.plan?.id === 4 || subscriptionData.plan?.price === 0) {
                            return 'Selamanya';
                          }
                          // Check if end_date is null or invalid
                          if (!subscriptionData.end_date) {
                            return 'Selamanya';
                          }
                          // Check if date is default/invalid (01/01/1970)
                          const endDate = new Date(subscriptionData.end_date);
                          const defaultDate = new Date('1970-01-01');
                          if (endDate.getTime() === defaultDate.getTime() || isNaN(endDate.getTime())) {
                            return 'Selamanya';
                          }
                          return formatDate(subscriptionData.end_date);
                        })()}
                      </span>
                    </div>
                  </div>

                  {/* Full Width Refresh Button */}
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <button
                      onClick={handleRefresh}
                      disabled={refreshing || loading}
                      className="w-full flex items-center justify-center gap-2 py-2.5 bg-gray-50 hover:bg-gray-100 
                        text-gray-600 font-semibold rounded-xl border border-gray-200 transition-all disabled:opacity-50"
                    >
                      <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                      <span>{refreshing ? 'Memperbarui Data...' : 'Refresh'}</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Pilih Paket */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Pilih Paket</h2>

            {/* Duration Tabs */}
            <div className="flex gap-2 overflow-x-auto pt-4 pb-2 mb-5 no-scrollbar">
              {[
                {
                  duration: null, label: 'Gratis', sub: 'Selamanya', badge: 'GRATIS',
                  activeClass: 'bg-green-500 text-white border-green-500',
                  badgeClass: 'bg-green-100 text-green-700'
                },
                {
                  duration: 30, label: '1 Bulan', sub: 'Harga Normal', badge: null,
                  activeClass: 'bg-blue-600 text-white border-blue-600',
                  badgeClass: null
                },
                {
                  duration: 90, label: '3 Bulan', sub: 'Hemat 20%', badge: '-20%',
                  activeClass: 'bg-orange-500 text-white border-orange-500',
                  badgeClass: 'bg-orange-100 text-orange-700'
                },
                {
                  duration: 365, label: '1 Tahun', sub: 'Hemat 50%', badge: '-50%',
                  activeClass: 'bg-purple-600 text-white border-purple-600',
                  badgeClass: 'bg-purple-100 text-purple-700'
                },
              ].map(tab => {
                const isActive = selectedDuration === tab.duration;
                return (
                  <button
                    key={String(tab.duration)}
                    onClick={() => setSelectedDuration(tab.duration)}
                    className={`relative flex-shrink-0 flex flex-col items-center px-4 py-2.5 rounded-xl border-2 transition-all min-w-[80px] ${isActive ? tab.activeClass : 'border-gray-200 text-gray-600 bg-white hover:border-gray-300'
                      }`}
                  >
                    {tab.badge && (
                      <span className={`absolute -top-2 left-1/2 -translate-x-1/2 text-[9px] font-bold px-1.5 py-0.5 rounded-full ${isActive ? 'bg-white text-gray-800' : tab.badgeClass
                        }`}>
                        {tab.badge}
                      </span>
                    )}
                    <span className="text-sm font-bold leading-tight mt-1">{tab.label}</span>
                    <span className={`text-[10px] mt-0.5 ${isActive ? 'opacity-80' : 'text-gray-400'}`}>
                      {tab.sub}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Plan Cards */}
            <div className="space-y-3">
              {availablePlans.length === 0 ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
                </div>
              ) : getFilteredPlans().length === 0 ? (
                <p className="text-center text-gray-400 py-6 text-sm">Tidak ada paket tersedia</p>
              ) : (
                getFilteredPlans().map(plan => {
                  const discountInfo = getDiscountInfo(plan);
                  const monthlyPrice = getMonthlyPrice(plan);
                  const isCurrent = subscriptionData?.plan?.id === plan.id;
                  const isLoading = checkoutLoadingPlanId === plan.id;
                  return (
                    <div key={plan.id} className={`relative border-2 rounded-xl p-4 transition-all ${isCurrent ? 'border-blue-400 bg-blue-50' : 'border-gray-200 bg-white'
                      }`}>
                      {/* Discount badge */}
                      {discountInfo && (
                        <span className="absolute -top-2.5 left-4 bg-orange-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                          HEMAT {discountInfo.discount}%
                        </span>
                      )}
                      {isCurrent && (
                        <span className="absolute -top-2.5 right-4 bg-blue-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                          PAKET AKTIF
                        </span>
                      )}

                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <p className="font-bold text-gray-900 text-base">{plan.name}</p>
                          <div className="flex items-baseline gap-2 mt-1">
                            <p className="text-xl font-bold text-blue-600">
                              {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(plan.price)}
                            </p>
                            {discountInfo && (
                              <p className="text-xs text-gray-400 line-through">
                                {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(discountInfo.originalPrice)}
                              </p>
                            )}
                          </div>
                          {plan.duration_days !== 9999 && (
                            <p className="text-xs text-gray-400 mt-0.5">
                              ≈ {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(monthlyPrice)}/bulan
                            </p>
                          )}
                          {discountInfo && discountInfo.saved > 0 && (
                            <p className="text-xs font-semibold text-green-600 mt-1">
                              💰 Hemat {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(discountInfo.saved)}
                            </p>
                          )}
                        </div>

                        <button
                          onClick={() => handleDirectCheckout(plan.id)}
                          disabled={isLoading || !!checkoutLoadingPlanId}
                          className={`flex items-center gap-1.5 px-3 py-2.5 rounded-lg font-semibold text-sm transition-all flex-shrink-0 ${isLoading || !!checkoutLoadingPlanId
                            ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                            : 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm'
                            }`}
                        >
                          {isLoading
                            ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                            : <Zap className="w-4 h-4" />
                          }
                          <span>{isLoading ? '...' : isCurrent ? 'Perpanjang' : 'Pilih'}</span>
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 gap-4">
            <button
              onClick={() => navigate('/billing-active-tenant-history')}
              className="bg-white border border-gray-200 rounded-lg p-4 text-center hover:shadow-sm transition-shadow"
            >
              <Calendar className="w-6 h-6 text-gray-600 mx-auto mb-2" />
              <p className="font-medium text-gray-800">Riwayat</p>
              <p className="text-sm text-gray-500">Lihat semua pembayaran</p>
            </button>
          </div>
        </div>
      </div>



      {/* Konfirmasi Pembayaran Modal */}
      {confirmPayment.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CreditCard className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 font-montserrat mb-2">
                Konfirmasi Pembayaran
              </h3>
              <p className="text-sm text-gray-600 font-montserrat">
                Klik tombol di bawah untuk membuka halaman pembayaran
              </p>
            </div>
            <a
              href={confirmPayment.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-4 px-4 rounded-lg transition-colors font-montserrat text-center text-lg mb-3"
              onClick={() => setConfirmPayment({ show: false, url: '', label: '' })}
            >
              <CreditCard className="w-5 h-5 inline mr-2" />
              {confirmPayment.label}
            </a>
            <button
              onClick={() => setConfirmPayment({ show: false, url: '', label: '' })}
              className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 px-4 rounded-lg transition-colors font-montserrat"
            >
              Tutup
            </button>
          </div>
        </div>
      )}

      {/* Tripay Payment Modal */}
      {showTripayModal && selectedBilling && (
        <TripayPaymentModal
          billing={selectedBilling}
          onClose={() => {
            setShowTripayModal(false);
            setSelectedBilling(null);
            setSelectedChannel(null);
            setTripayTransaction(null);
            setPaymentStatus('pending');
            if (statusPolling) {
              clearInterval(statusPolling);
              setStatusPolling(null);
            }
          }}
          onCloseCallback={() => {
            // Trigger fetch ulang data saat modal ditutup
            fetchData();
          }}
          onSuccess={handleTripaySuccess}
          isActiveTenant={true}
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
        onPayment={handlePayment}
        onTripayPayment={handleTripayPaymentSuccess}
        onCheckPayment={handleCheckPayment}
        onRefreshStatus={handleRefreshStatus}
        generatingCode={generatingCode}
        isConfirmingPayment={isConfirmingPayment}
        isActiveTenant={true}
      />
    </div>
  );
};

export default BillingActiveTenantPayment;