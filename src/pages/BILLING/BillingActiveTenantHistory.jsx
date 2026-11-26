import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import HeaderBilling from '../../components/Com Header/HeaderBilling';
import { getUserProfile } from '../../utils/userProfileHelper';
import api from '../../config/api';
import activeTenantPaymentService from './services/activeTenantPaymentService';
import { formatBillingStatus, formatPaymentMethod, formatCurrency, formatDateShort } from '../../utils/billingFormatter';
import { 
  ArrowLeft, 
  Search, 
  Filter, 
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  Receipt
} from 'lucide-react';

const BillingTenantHistory = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [tenantId, setTenantId] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [billingHistory, setBillingHistory] = useState([]);
  const [stats, setStats] = useState({
    unpaid: { count: 0, total_amount: 0 },
    pending: { count: 0, total_amount: 0 },
    paid: { count: 0, total_amount: 0 },
    failed: { count: 0, total_amount: 0 }
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  // Load tenant ID from location state or user profile
  useEffect(() => {
    const loadTenantId = async () => {
      try {
        // First try to get from location state (passed from parent)
        if (location.state?.tenantId) {
          setTenantId(location.state.tenantId);
          setUserProfile(location.state.userProfile);
          console.log('✅ BillingActiveTenantHistory - Tenant ID from location state:', location.state.tenantId);
        } else {
          // Fallback to getUserProfile
          const profile = await getUserProfile();
          if (profile?.tenant?.id) {
            setTenantId(profile.tenant.id);
            setUserProfile(profile);
            console.log('✅ BillingActiveTenantHistory - Tenant ID from profile:', profile.tenant.id);
          } else {
            console.warn('⚠️ BillingActiveTenantHistory - No tenant ID found');
          }
        }
      } catch (error) {
        console.error('❌ BillingActiveTenantHistory - Failed to load tenant ID:', error);
      }
    };

    loadTenantId();
  }, [location.state]);

  // Fetch billing history from API
  const fetchBillingHistory = async () => {
    if (!tenantId) return;
    
    try {
      setLoading(true);
      console.log('🔍 BillingActiveTenantHistory - Fetching billing history for tenant:', tenantId);
      
      const response = await activeTenantPaymentService.getBillingHistory(tenantId);
      
      if (response.success) {
        console.log('✅ BillingActiveTenantHistory - API Response:', response.data);
        
        // Transform API data to match frontend format
        const transformedBillings = response.data.billings.map(billing => ({
          id: billing.id,
          invoiceNumber: `INV-${billing.id}-${new Date(billing.createdAt).getFullYear()}`,
          amount: parseFloat(billing.amount),
          status: billing.status,
          paymentMethod: billing.payment_method || null,
          paidAt: billing.paid_at || null,
          dueDate: billing.due_date,
          plan: billing.subscription?.plan?.name || 'Unknown Plan',
          createdAt: billing.createdAt,
          paymentReference: billing.payment_reference || null
        }));
        
        setBillingHistory(transformedBillings);
        setStats(response.data.stats);
        
        console.log('✅ BillingActiveTenantHistory - Data transformed:', {
          billingCount: transformedBillings.length,
          stats: response.data.stats
        });
      } else {
        console.warn('⚠️ BillingActiveTenantHistory - API returned unsuccessful response:', response);
        // Fallback to empty data
        setBillingHistory([]);
        setStats({
          unpaid: { count: 0, total_amount: 0 },
          pending: { count: 0, total_amount: 0 },
          paid: { count: 0, total_amount: 0 },
          failed: { count: 0, total_amount: 0 }
        });
      }
    } catch (error) {
      console.error('❌ BillingActiveTenantHistory - Error fetching billing history:', error);
      
      // Show error state or fallback to empty data
      setBillingHistory([]);
      setStats({
        unpaid: { count: 0, total_amount: 0 },
        pending: { count: 0, total_amount: 0 },
        paid: { count: 0, total_amount: 0 },
        failed: { count: 0, total_amount: 0 }
      });
    } finally {
      setLoading(false);
    }
  };

  // Fetch data when tenant ID is available
  useEffect(() => {
    if (tenantId) {
      fetchBillingHistory();
    }
  }, [tenantId]);

  const getStatusIcon = (status) => {
    switch (status) {
      case 'paid':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'unpaid':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-500" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-gray-500" />;
      default:
        return <Clock className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusText = (status) => {
    const statusInfo = formatBillingStatus(status);
    return statusInfo.text;
  };

  const getStatusColor = (status) => {
    const statusInfo = formatBillingStatus(status);
    return `${statusInfo.color} ${statusInfo.bgColor}`;
  };

  const formatDate = (dateString) => {
    return formatDateShort(dateString);
  };

  const filteredHistory = billingHistory.filter(item => {
    const matchesSearch = item.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.plan.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || item.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600 font-montserrat">Memuat riwayat pembayaran...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <HeaderBilling 
        title="Riwayat Pembayaran" 
        description="Semua riwayat pembayaran Anda"
        onBack={() => navigate(-1)}
      />
      
      <div className="pt-6 pb-6 px-4 max-w-[390px] md:max-w-4xl mx-auto">

        {/* Search and Filter */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
          <div className="space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Cari berdasarkan nomor invoice atau plan..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent font-montserrat"
              />
            </div>

            {/* Filter Dropdown */}
            <div className="relative">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent font-montserrat appearance-none bg-white"
              >
                <option value="all">Semua Status</option>
                <option value="paid">Lunas</option>
                <option value="unpaid">Belum Bayar</option>
                <option value="pending">Pending</option>
                <option value="failed">Gagal</option>
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Billing History List */}
        <div className="space-y-4">
          {filteredHistory.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-sm p-8 text-center">
              <Receipt className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-600 font-montserrat mb-2">
                Tidak ada riwayat pembayaran
              </h3>
              <p className="text-gray-500 font-montserrat">
                Belum ada riwayat pembayaran yang ditemukan
              </p>
            </div>
          ) : (
            filteredHistory.map((item) => (
              <div key={item.id} className="bg-white rounded-2xl shadow-sm p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(item.status)}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800 font-montserrat">
                        {item.invoiceNumber}
                      </h3>
                      <p className="text-sm text-gray-600 font-montserrat">
                        {item.plan}
                      </p>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                    {getStatusText(item.status)}
                  </span>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 font-montserrat">Jumlah:</span>
                    <span className="text-lg font-semibold text-gray-800 font-montserrat">
                      {formatCurrency(item.amount)}
                    </span>
                  </div>

                  {item.paymentMethod && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 font-montserrat">Metode Pembayaran:</span>
                      <span className="text-sm text-gray-800 font-montserrat">{formatPaymentMethod(item.paymentMethod)}</span>
                    </div>
                  )}

                  {item.paymentReference && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 font-montserrat">Referensi:</span>
                      <span className="text-sm text-gray-800 font-montserrat font-mono">{item.paymentReference}</span>
                    </div>
                  )}

                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 font-montserrat">Tanggal Jatuh Tempo:</span>
                    <span className="text-sm text-gray-800 font-montserrat">{formatDate(item.dueDate)}</span>
                  </div>

                  {item.paidAt && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 font-montserrat">Tanggal Dibayar:</span>
                      <span className="text-sm text-gray-800 font-montserrat">{formatDate(item.paidAt)}</span>
                    </div>
                  )}
                </div>

                {/* History page is read-only - no action buttons */}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default BillingTenantHistory;
