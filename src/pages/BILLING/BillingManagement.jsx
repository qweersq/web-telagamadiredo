import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import HeaderBerandaOwner from '../../components/Com Header/HeaderBerandaOwner';
import AnimatedButton from '../../components/Design/AnimatedButton';
import { 
  ArrowLeft, 
  Search, 
  Filter, 
  CreditCard, 
  Calendar, 
  DollarSign, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Plus,
  Eye,
  Download,
  RefreshCw,
  Info,
  Copy,
  TrendingUp,
  Users,
  Settings
} from 'lucide-react';
import instance from '../../config/api';

const BillingManagement = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'upcoming', 'paid', 'pending'
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedBilling, setSelectedBilling] = useState(null);
  const [isConfirmingPayment, setIsConfirmingPayment] = useState(false);
  const [showChangePlanModal, setShowChangePlanModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState('');
  const [isChangingPlan, setIsChangingPlan] = useState(false);
  
  // Data states
  const [subscriptionData, setSubscriptionData] = useState(null);
  const [billingHistory, setBillingHistory] = useState([]);
  const [upcomingBillings, setUpcomingBillings] = useState([]);
  const [availablePlans, setAvailablePlans] = useState([]);
  const [billingStats, setBillingStats] = useState({
    totalPaid: 0,
    totalPending: 0,
    totalUpcoming: 0,
    nextBillingDate: null
  });
  
  // Filter states
  const [dateRange, setDateRange] = useState({
    start: '',
    end: ''
  });
  const [statusFilter, setStatusFilter] = useState('all');
  const [amountFilter, setAmountFilter] = useState('all');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      const promises = [
        fetchSubscriptionStatus(),
        fetchBillingHistory(),
        fetchUpcomingBillings(),
        fetchAvailablePlans()
      ];
      
      await Promise.all(promises);
      calculateBillingStats();
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSubscriptionStatus = async () => {
    try {
      const { data } = await instance.get('/get-profile');
      if (data.success) {
        setSubscriptionData(data.data.subscription);
      }
    } catch (error) {
      console.error('Error fetching subscription status:', error);
    }
  };

  const fetchBillingHistory = async () => {
    try {
      const { data } = await instance.get('/tenant-payments/history');
      if (data.success) {
        setBillingHistory(data.data.billings || []);
      }
    } catch (error) {
      console.error('Error fetching billing history:', error);
    }
  };

  const fetchUpcomingBillings = async () => {
    try {
      const { data } = await instance.get('/tenant-payments/upcoming');
      if (data.success) {
        setUpcomingBillings(data.data);
      }
    } catch (error) {
      console.error('Error fetching upcoming billings:', error);
    }
  };

  const fetchAvailablePlans = async () => {
    try {
      const { data } = await instance.get('/subscription-plans/active');
      if (data.success) {
        setAvailablePlans(data.data);
      }
    } catch (error) {
      console.error('Error fetching available plans:', error);
    }
  };

  const calculateBillingStats = () => {
    const paid = billingHistory.filter(b => b.status === 'paid');
    const pending = billingHistory.filter(b => b.status === 'pending');
    const upcoming = upcomingBillings.length;
    
    const totalPaid = paid.reduce((sum, b) => sum + parseFloat(b.amount || 0), 0);
    const totalPending = pending.reduce((sum, b) => sum + parseFloat(b.amount || 0), 0);
    const totalUpcoming = upcomingBillings.reduce((sum, b) => sum + parseFloat(b.amount || 0), 0);
    
    const nextBilling = upcomingBillings.length > 0 ? upcomingBillings[0].due_date : null;
    
    setBillingStats({
      totalPaid,
      totalPending,
      totalUpcoming,
      nextBillingDate: nextBilling
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'paid':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-500" />;
      case 'unpaid':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'unpaid':
        return 'bg-red-100 text-red-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredBillingHistory = billingHistory.filter(billing => {
    const matchesSearch = billing.invoice_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         billing.amount?.toString().includes(searchTerm);
    const matchesStatus = activeTab === 'all' || billing.status === activeTab;
    return matchesSearch && matchesStatus;
  });

  const handlePayBilling = async (billingId) => {
    try {
      const billing = [...billingHistory, ...upcomingBillings].find(b => b.id === billingId);
      if (billing) {
        setSelectedBilling(billing);
        setShowPaymentModal(true);
      }
    } catch (error) {
      console.error('Error initiating payment:', error);
      alert('Gagal memulai pembayaran. Silakan coba lagi.');
    }
  };

  const handleConfirmPayment = async () => {
    try {
      setIsConfirmingPayment(true);
      
      const response = await instance.post('/tenant-payments/submit-payment', {
        billing_id: selectedBilling.id,
        payment_method: 'manual_bank_transfer',
        bank_name: 'BCA',
        account_number: '1234567890',
        account_holder: 'PT. NotaSepatu',
        amount: selectedBilling.amount,
        notes: `Manual payment confirmation for invoice ${selectedBilling.invoice_number}`
      });

      if (response.data.success) {
        alert('Pembayaran berhasil dikonfirmasi! Tim kami akan memverifikasi pembayaran Anda dalam 1x24 jam.');
        setShowPaymentModal(false);
        setSelectedBilling(null);
        await fetchData();
      } else {
        alert(`Gagal mengkonfirmasi pembayaran: ${response.data.message || 'Terjadi kesalahan'}`);
      }
    } catch (error) {
      console.error('Error confirming payment:', error);
      alert('Gagal mengkonfirmasi pembayaran. Silakan coba lagi.');
    } finally {
      setIsConfirmingPayment(false);
    }
  };

  const handleChangePlan = (billing) => {
    setSelectedBilling(billing);
    setShowChangePlanModal(true);
  };

  const handleChangePlanSubmit = async () => {
    if (!selectedPlan || !selectedBilling) {
      alert('Harap pilih plan yang diinginkan');
      return;
    }

    try {
      setIsChangingPlan(true);
      const response = await instance.patch(`/tenant-payments/${selectedBilling.id}/change-plan`, {
        plan_id: parseInt(selectedPlan)
      });

      if (response.data.success) {
        alert('Plan berhasil diubah!');
        setShowChangePlanModal(false);
        setSelectedBilling(null);
        setSelectedPlan('');
        await fetchData();
      } else {
        alert(`Gagal mengubah plan: ${response.data.message || 'Terjadi kesalahan'}`);
      }
    } catch (error) {
      console.error('Error changing plan:', error);
      alert('Gagal mengubah plan. Silakan coba lagi.');
    } finally {
      setIsChangingPlan(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Memuat data billing...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[100dvh] flex flex-col overflow-hidden font-montserrat">
      <HeaderBerandaOwner 
        title="Billing Management" 
        description="Kelola Pembayaran & Langganan"
        showBackButton={true}
        fromBerandaOwner={true}
        currentTime={new Date().toLocaleTimeString()}
      />  
      
      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto px-3 md:px-6 pt-6 pb-6">
          <div className="max-w-[390px] md:max-w-4xl mx-auto mt-16">

            {/* Current Subscription Status - Active/Trial User */}
            {subscriptionData && (
              <div className={`bg-white rounded-xl border-2 p-6 mb-4 md:mb-6 shadow-sm ${
                subscriptionData.status === 'trial' ? 'border-orange-200' : 'border-green-200'
              }`}>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-lg font-bold text-gray-800 font-montserrat">
                      Status Langganan
                    </h2>
                    <div className={`mt-2 p-3 rounded-xl border-2 ${
                      subscriptionData.status === 'trial' 
                        ? 'bg-orange-50 border-orange-200' 
                        : 'bg-green-50 border-green-200'
                    }`}>
                      <div className="flex items-center space-x-2">
                        <div className={`w-2 h-2 rounded-full ${
                          subscriptionData.status === 'trial' ? 'bg-orange-500' : 'bg-green-500'
                        }`}></div>
                        <span className={`text-sm font-semibold font-montserrat ${
                          subscriptionData.status === 'trial' ? 'text-orange-800' : 'text-green-800'
                        }`}>
                          {subscriptionData.status === 'trial' ? 'Masa Trial' : 'Langganan Aktif'} - {subscriptionData.plan?.name || 'Unknown Plan'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div className={`bg-gradient-to-r rounded-xl p-4 border-2 ${
                    subscriptionData.status === 'trial'
                      ? 'from-orange-50 to-orange-100 border-orange-200'
                      : 'from-green-50 to-green-100 border-green-200'
                  }`}>
                    <h3 className="font-bold text-gray-700 font-montserrat mb-2 text-sm">
                      {subscriptionData.status === 'trial' ? 'Paket Trial' : 'Paket Aktif'}
                    </h3>
                    <p className="text-gray-900 font-montserrat text-lg font-semibold">
                      {subscriptionData.plan?.name || 'Tidak Diketahui'}
                    </p>
                    <p className="text-xs text-gray-600 font-montserrat">
                      {subscriptionData.status === 'trial' 
                        ? 'Gratis 7 Hari' 
                        : `${formatCurrency(subscriptionData.plan?.price || 0)}/bulan`
                      }
                    </p>
                  </div>
                  
                  <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl p-4 border-2 border-blue-200">
                    <h3 className="font-bold text-gray-700 font-montserrat mb-2 text-sm">
                      {subscriptionData.status === 'trial' ? 'Trial Berakhir' : 'Berakhir'}
                    </h3>
                    <p className="text-gray-900 font-montserrat text-lg font-semibold">
                      {subscriptionData.end_date ? formatDate(subscriptionData.end_date) : 'Tidak Ada'}
                    </p>
                    <p className="text-xs text-gray-600 font-montserrat">
                      {subscriptionData.days_remaining || 0} hari tersisa
                    </p>
                  </div>
                  
                  <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-xl p-4 border-2 border-purple-200">
                    <h3 className="font-bold text-gray-700 font-montserrat mb-2 text-sm">Fitur</h3>
                    <p className="text-gray-900 font-montserrat text-lg font-semibold">
                      {subscriptionData.plan?.max_users || 0} User
                    </p>
                    <p className="text-xs text-gray-600 font-montserrat">
                      {subscriptionData.plan?.max_branches || 0} Cabang
                    </p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                  <AnimatedButton
                    onClick={() => navigate('/subscription-payment')}
                    className="flex-1 px-3 py-2.5 bg-blue-500 text-white rounded-xl font-montserrat text-xs sm:text-sm font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] hover:bg-blue-600"
                  >
                    <span className="truncate">Ubah Paket</span>
                  </AnimatedButton>
                  
                  <AnimatedButton
                    onClick={fetchData}
                    className="flex-1 px-3 py-2.5 bg-gray-500 text-white rounded-xl hover:bg-gray-600 font-montserrat text-xs sm:text-sm font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] flex items-center justify-center"
                  >
                    <RefreshCw className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                    <span className="truncate">Refresh</span>
                  </AnimatedButton>
                </div>
              </div>
            )}

            {/* Billing Statistics */}
            <div className="bg-white rounded-xl border-2 border-gray-200 p-6 mb-4 md:mb-6 shadow-sm">
              <h2 className="text-lg font-bold text-gray-800 font-montserrat mb-4">
                Ringkasan Billing
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-green-50 rounded-xl p-4 border-2 border-green-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-green-600 font-montserrat font-semibold">Total Lunas</p>
                      <p className="text-lg font-bold text-green-800 font-montserrat">
                        {formatCurrency(billingStats.totalPaid)}
                      </p>
                    </div>
                    <CheckCircle className="w-6 h-6 text-green-500" />
                  </div>
                </div>
                
                <div className="bg-yellow-50 rounded-xl p-4 border-2 border-yellow-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-yellow-600 font-montserrat font-semibold">Pending</p>
                      <p className="text-lg font-bold text-yellow-800 font-montserrat">
                        {formatCurrency(billingStats.totalPending)}
                      </p>
                    </div>
                    <Clock className="w-6 h-6 text-yellow-500" />
                  </div>
                </div>
                
                <div className="bg-blue-50 rounded-xl p-4 border-2 border-blue-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-blue-600 font-montserrat font-semibold">Mendatang</p>
                      <p className="text-lg font-bold text-blue-800 font-montserrat">
                        {formatCurrency(billingStats.totalUpcoming)}
                      </p>
                    </div>
                    <Calendar className="w-6 h-6 text-blue-500" />
                  </div>
                </div>
                
                <div className="bg-purple-50 rounded-xl p-4 border-2 border-purple-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-purple-600 font-montserrat font-semibold">Tagihan Selanjutnya</p>
                      <p className="text-sm font-bold text-purple-800 font-montserrat">
                        {billingStats.nextBillingDate ? formatDate(billingStats.nextBillingDate) : 'Tidak Ada'}
                      </p>
                    </div>
                    <TrendingUp className="w-6 h-6 text-purple-500" />
                  </div>
                </div>
              </div>
            </div>

            {/* Upcoming Billings */}
            {upcomingBillings.length > 0 && (
              <div className="bg-white rounded-xl border-2 border-gray-200 p-6 mb-4 md:mb-6 shadow-sm">
                <h2 className="text-lg font-bold text-gray-800 font-montserrat mb-4">
                  Tagihan Mendatang
                </h2>
                <div className="space-y-4">
                  {upcomingBillings.map((billing) => (
                    <div key={billing.id} className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-200 group">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                            <Calendar className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-bold text-gray-800 font-montserrat text-sm">
                              {billing.invoice_number}
                            </p>
                            <p className="text-xs text-gray-600 font-montserrat">
                              Jatuh tempo: {formatDate(billing.due_date)}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-gray-800 font-montserrat text-lg">
                            {formatCurrency(billing.amount)}
                          </p>
                          <div className="flex flex-col sm:flex-row gap-2 mt-2">
                            <AnimatedButton
                              onClick={() => handleChangePlan(billing)}
                              className="flex-1 px-2 py-1.5 bg-blue-500 text-white rounded-lg text-xs font-semibold hover:bg-blue-600 shadow-md hover:shadow-lg transition-all duration-200 text-center"
                            >
                              <span className="truncate">Ubah Plan</span>
                            </AnimatedButton>
                            <AnimatedButton
                              onClick={() => handlePayBilling(billing.id)}
                              className="flex-1 px-2 py-1.5 bg-green-500 text-white rounded-lg text-xs font-semibold hover:bg-green-600 shadow-md hover:shadow-lg transition-all duration-200 text-center"
                            >
                              <span className="truncate">Bayar Sekarang</span>
                            </AnimatedButton>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Search and Filter */}
            <div className="bg-white rounded-xl border-2 border-gray-200 p-4 mb-4 md:mb-6 shadow-sm">
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mb-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Cari invoice atau nominal..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 font-montserrat text-sm placeholder-gray-400"
                  />
                </div>
                <button
                  onClick={() => setShowFilterModal(true)}
                  className="px-3 py-2.5 border-2 border-gray-200 rounded-xl hover:bg-gray-50 font-montserrat flex items-center justify-center gap-2 text-sm font-semibold hover:border-gray-300 transition-all duration-200 whitespace-nowrap"
                >
                  <Filter className="w-4 h-4" />
                  <span className="truncate">Filter</span>
                </button>
              </div>

              {/* Tabs */}
              <div className="bg-gray-50 rounded-xl p-1">
                <div className="flex space-x-1">
                  {[
                    { key: 'all', label: 'Semua', count: billingHistory.length },
                    { key: 'upcoming', label: 'Mendatang', count: upcomingBillings.length },
                    { key: 'pending', label: 'Pending', count: billingHistory.filter(b => b.status === 'pending').length },
                    { key: 'paid', label: 'Lunas', count: billingHistory.filter(b => b.status === 'paid').length }
                  ].map((tab) => (
                    <button
                      key={tab.key}
                      onClick={() => setActiveTab(tab.key)}
                      className={`flex-1 py-2 px-3 rounded-lg text-sm font-semibold transition-all duration-200 ${
                        activeTab === tab.key
                          ? 'bg-white text-blue-600 shadow-md border border-blue-100'
                          : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                      }`}
                    >
                      <div className="flex items-center justify-center gap-1">
                        <div className={`w-1.5 h-1.5 rounded-full ${
                          activeTab === tab.key ? 'bg-blue-500' : 'bg-gray-400'
                        }`}></div>
                        <span className="truncate">{tab.label} ({tab.count})</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Billing History */}
            <div className="bg-white rounded-xl border-2 border-gray-200 p-6 shadow-sm">
              <h2 className="text-lg font-bold text-gray-800 font-montserrat mb-4">
                Riwayat Pembayaran
              </h2>
              
              {filteredBillingHistory.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CreditCard className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">
                    {searchTerm ? 'Tidak ada data pembayaran yang ditemukan' : 'Belum ada data pembayaran'}
                  </h3>
                  <p className="text-gray-500 text-sm">
                    {searchTerm ? 'Coba kata kunci lain' : 'Mulai dengan melakukan pembayaran pertama'}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredBillingHistory.map((billing) => (
                    <div key={billing.id} className="bg-white border-2 border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-200 group">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
                            {getStatusIcon(billing.status)}
                          </div>
                          <div>
                            <h3 className="font-bold text-gray-800 text-base">
                              {billing.invoice_number}
                            </h3>
                            <p className="text-sm text-gray-600">
                              {formatDate(billing.paid_at || billing.createdAt)}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <div className="text-xl font-bold text-green-600">
                              {formatCurrency(billing.amount)}
                            </div>
                          </div>
                          <span className={`px-3 py-1 rounded-lg text-xs font-semibold ${getStatusColor(billing.status)}`}>
                            {billing.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>
      </main>

      {/* Modals - Similar to BillingPayment but for active users */}
      {/* Payment Modal */}
      {showPaymentModal && selectedBilling && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-gray-800 font-montserrat">
                Informasi Pembayaran
              </h3>
              <button
                onClick={() => {
                  setShowPaymentModal(false);
                  setSelectedBilling(null);
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Invoice Info */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <div className="flex items-center mb-3">
                  <CreditCard className="w-5 h-5 text-blue-600 mr-2" />
                  <h4 className="font-bold text-blue-800 font-montserrat">Detail Tagihan</h4>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-blue-700 font-montserrat">Invoice:</span>
                    <span className="text-sm font-semibold text-blue-800 font-montserrat">
                      {selectedBilling.invoice_number}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-blue-700 font-montserrat">Jatuh Tempo:</span>
                    <span className="text-sm font-semibold text-blue-800 font-montserrat">
                      {formatDate(selectedBilling.due_date || selectedBilling.createdAt)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-blue-700 font-montserrat">Status:</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-montserrat ${getStatusColor(selectedBilling.status)}`}>
                      {selectedBilling.status}
                    </span>
                  </div>
                </div>
              </div>

              {/* Payment Amount */}
              <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                <div className="flex items-center mb-3">
                  <DollarSign className="w-5 h-5 text-green-600 mr-2" />
                  <h4 className="font-bold text-green-800 font-montserrat">Nominal Pembayaran</h4>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-green-800 font-montserrat">
                    {formatCurrency(selectedBilling.amount)}
                  </p>
                  <p className="text-sm text-green-600 font-montserrat mt-1">
                    Transfer sesuai nominal yang tertera
                  </p>
                </div>
              </div>

              {/* Bank Account Info */}
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                <div className="flex items-center mb-3">
                  <CreditCard className="w-5 h-5 text-gray-600 mr-2" />
                  <h4 className="font-bold text-gray-800 font-montserrat">Rekening Tujuan</h4>
                </div>
                <div className="space-y-3">
                  <div className="bg-white border border-gray-200 rounded-lg p-3">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-gray-700 font-montserrat">Bank</span>
                      <span className="text-sm font-bold text-gray-800 font-montserrat">BCA</span>
                    </div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-gray-700 font-montserrat">No. Rekening</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-gray-800 font-montserrat">1234567890</span>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText('1234567890');
                            alert('Nomor rekening berhasil disalin!');
                          }}
                          className="p-1 rounded bg-blue-100 hover:bg-blue-200 text-blue-600 transition-colors"
                        >
                          <Copy className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-700 font-montserrat">Atas Nama</span>
                      <span className="text-sm font-bold text-gray-800 font-montserrat">PT. NotaSepatu</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                <button
                  onClick={() => {
                    setShowPaymentModal(false);
                    setSelectedBilling(null);
                  }}
                  className="flex-1 px-4 py-3 bg-gray-100 border-2 border-gray-200 text-gray-600 rounded-xl font-semibold text-sm hover:bg-gray-200 hover:border-gray-300 transition-all duration-200 font-montserrat"
                >
                  <span className="truncate">Batal</span>
                </button>
                <button
                  onClick={handleConfirmPayment}
                  disabled={isConfirmingPayment}
                  className={`flex-1 px-4 py-3 text-white rounded-xl font-semibold text-sm flex items-center justify-center transition-all duration-200 font-montserrat ${
                    isConfirmingPayment 
                      ? 'bg-gray-400 cursor-not-allowed' 
                      : 'bg-green-500 border-2 border-green-500 hover:bg-green-600 hover:border-green-600'
                  }`}
                >
                  {isConfirmingPayment ? (
                    <>
                      <div className="animate-spin rounded-full h-3 w-3 sm:h-4 sm:w-4 border-b-2 border-white mr-1 sm:mr-2"></div>
                      <span className="truncate">Mengkonfirmasi...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                      <span className="truncate">Sudah Transfer</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Change Plan Modal */}
      {showChangePlanModal && selectedBilling && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-gray-800 font-montserrat">
                Ubah Subscription Plan
              </h3>
              <button
                onClick={() => {
                  setShowChangePlanModal(false);
                  setSelectedBilling(null);
                  setSelectedPlan('');
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Current Billing Info */}
              <div className="bg-gray-50 border-2 border-gray-200 rounded-xl p-4">
                <h4 className="font-bold text-gray-800 font-montserrat mb-2">Billing Saat Ini</h4>
                <p className="text-sm text-gray-600 font-montserrat">
                  <strong>Invoice:</strong> {selectedBilling.invoice_number}
                </p>
                <p className="text-sm text-gray-600 font-montserrat">
                  <strong>Amount:</strong> {formatCurrency(selectedBilling.amount)}
                </p>
              </div>

              {/* Plan Selection */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3 font-montserrat">
                  Pilih Plan Baru
                </label>
                <div className="space-y-3">
                  {availablePlans.map((plan) => (
                    <div
                      key={plan.id}
                      className={`border-2 rounded-xl p-4 cursor-pointer transition-all duration-200 hover:shadow-md ${
                        selectedPlan === plan.id.toString()
                          ? 'border-blue-500 bg-blue-50 shadow-md'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setSelectedPlan(plan.id.toString())}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h5 className="font-bold text-gray-800 font-montserrat">{plan.name}</h5>
                          <p className="text-sm text-gray-600 font-montserrat">{plan.description}</p>
                          <div className="flex items-center gap-4 mt-2">
                            <span className="text-lg font-bold text-blue-600 font-montserrat">
                              {formatCurrency(plan.price)}
                            </span>
                            <span className="text-sm text-gray-500 font-montserrat">
                              {plan.duration_days} hari
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center">
                          <input
                            type="radio"
                            name="plan"
                            value={plan.id}
                            checked={selectedPlan === plan.id.toString()}
                            onChange={() => setSelectedPlan(plan.id.toString())}
                            className="w-4 h-4 text-blue-600"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mt-6">
              <button
                onClick={() => {
                  setShowChangePlanModal(false);
                  setSelectedBilling(null);
                  setSelectedPlan('');
                }}
                className="flex-1 px-4 py-3 bg-gray-100 border-2 border-gray-200 text-gray-600 rounded-xl font-semibold text-sm hover:bg-gray-200 hover:border-gray-300 transition-all duration-200 font-montserrat"
              >
                <span className="truncate">Batal</span>
              </button>
              <button
                onClick={handleChangePlanSubmit}
                disabled={isChangingPlan || !selectedPlan}
                className={`flex-1 px-4 py-3 text-white rounded-xl font-semibold text-sm flex items-center justify-center transition-all duration-200 font-montserrat ${
                  isChangingPlan || !selectedPlan
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-blue-500 border-2 border-blue-500 hover:bg-blue-600 hover:border-blue-600'
                }`}
              >
                {isChangingPlan ? (
                  <>
                    <div className="animate-spin rounded-full h-3 w-3 sm:h-4 sm:w-4 border-b-2 border-white mr-1 sm:mr-2"></div>
                    <span className="truncate">Mengubah...</span>
                  </>
                ) : (
                  <span className="truncate">Ubah Plan</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BillingManagement;
