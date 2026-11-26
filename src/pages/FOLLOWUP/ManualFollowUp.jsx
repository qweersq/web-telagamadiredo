import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Clock,
  Calendar,
  Phone,
  MessageSquare,
  Copy,
  CheckCircle,
  AlertCircle,
  Crown,
  MapPin,
  TrendingUp,
  BarChart3,
  RefreshCw,
  Filter,
  Eye,
  Send
} from 'lucide-react';
import HeaderBerandaOwner from '../../components/Com Header/HeaderBerandaOwner';
import AnimatedButton from '../../components/Design/AnimatedButton';
import instance from '../../config/api';
import { getUserProfile } from '../../utils/userProfileHelper';
import { getMembershipBadgeColor } from '../../utils/labelFormatter';

const ManualFollowUp = () => {
  const navigate = useNavigate();
  
  // State untuk statistics
  const [statistics, setStatistics] = useState({
    total_sent_this_month: 0,
    total_customers_contacted: 0,
    orders_after_followup: 0,
    conversion_rate: 0,
    revenue_from_followup: 0,
    success_rate: 0
  });
  
  // State untuk period tabs
  const [periodTabs, setPeriodTabs] = useState([]);
  const [selectedPeriod, setSelectedPeriod] = useState('20-30');
  
  // State untuk customers
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  
  // State untuk templates
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [messagePreview, setMessagePreview] = useState('');
  
  // State untuk user data
  const [tenantId, setTenantId] = useState(null);
  const [branchId, setBranchId] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  
  // State untuk loading
  const [loadingStatistics, setLoadingStatistics] = useState(false);
  const [loadingTabs, setLoadingTabs] = useState(false);
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [copyingMessage, setCopyingMessage] = useState(null);
  
  // State untuk modal dan filter
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewContent, setPreviewContent] = useState('');
  const [previewCustomer, setPreviewCustomer] = useState(null);
  const [hasFiltered, setHasFiltered] = useState(false);

  // Fetch user data
  useEffect(() => {
    const loadUserData = async () => {
      try {
        const profile = await getUserProfile();
        setUserProfile(profile);
        if (profile?.tenant?.id) {
          setTenantId(profile.tenant.id);
        }
        if (profile?.branch?.id) {
          setBranchId(profile.branch.id);
        }
      } catch (error) {
        console.error('❌ ManualFollowUp - Failed to load user data:', error);
      }
    };

    loadUserData();
  }, []);

  // Fetch data when component mounts
  useEffect(() => {
    console.log('🔄 ManualFollowUp - useEffect triggered, tenantId:', tenantId);
    
    if (tenantId) {
      const loadAllData = async () => {
        try {
          console.log('🔄 ManualFollowUp - Loading all data...');
          await Promise.all([
            fetchStatistics(),
            fetchPeriodTabs(),
            fetchTemplates()
          ]);
          console.log('✅ ManualFollowUp - All data loaded successfully');
        } catch (error) {
          console.error('❌ Error loading initial data:', error);
        } finally {
          console.log('🔄 ManualFollowUp - Setting loading to false');
          setLoading(false);
        }
      };
      
      loadAllData();
    } else {
      console.log('⚠️ ManualFollowUp - No tenantId, setting timeout');
      // If no tenantId after 5 seconds, stop loading
      const timeout = setTimeout(() => {
        console.log('⏰ ManualFollowUp - Timeout reached, setting loading to false');
        setLoading(false);
      }, 5000);
      
      return () => clearTimeout(timeout);
    }
  }, [tenantId]);

  // Fetch customers when period changes
  useEffect(() => {
    if (selectedPeriod && tenantId) {
      setCurrentPage(1);
      fetchCustomersByPeriod(selectedPeriod, 1);
    }
  }, [selectedPeriod, tenantId]);

  // Fetch statistics
  const fetchStatistics = async () => {
    try {
      setLoadingStatistics(true);
      const { data } = await instance.get('/customer-followups/statistics');
      
      if (data.success) {
        setStatistics(data.data);
      }
    } catch (error) {
      console.error('❌ Error fetching statistics:', error);
    } finally {
      setLoadingStatistics(false);
    }
  };

  // Fetch period tabs
  const fetchPeriodTabs = async () => {
    try {
      setLoadingTabs(true);
      const { data } = await instance.get('/customers/dormant-tabs');
      
      if (data.success) {
        setPeriodTabs(data.data.tabs);
        // Set default period to first tab
        if (data.data.tabs.length > 0) {
          setSelectedPeriod(data.data.tabs[0].period);
        }
      }
    } catch (error) {
      console.error('❌ Error fetching period tabs:', error);
    } finally {
      setLoadingTabs(false);
    }
  };

  // Fetch customers by period
  const fetchCustomersByPeriod = async (period, page = 1) => {
    try {
      setLoadingCustomers(true);
      const { data } = await instance.get(`/customers/dormant-by-period?period=${period}&page=${page}&limit=20`);
      
      if (data.success) {
        if (page === 1) {
          setCustomers(data.data.customers);
        } else {
          setCustomers(prev => [...prev, ...data.data.customers]);
        }
        setTotalPages(data.data.pagination.totalPages);
        setTotalItems(data.data.pagination.totalItems);
        setCurrentPage(page);
      }
    } catch (error) {
      console.error('❌ Error fetching customers by period:', error);
    } finally {
      setLoadingCustomers(false);
    }
  };

  // Get user data helper
  const getUserData = async () => {
    try {
      console.log('🔄 ManualFollowUp - Getting user profile...');
      const profile = await getUserProfile();
      console.log('📋 ManualFollowUp - User profile:', profile);
      
      if (!profile) {
        console.log('⚠️ ManualFollowUp - No profile found');
        return null;
      }
      
      const userData = {
        id: profile.user?.id,
        tenant_id: profile.tenant?.id,
        branch_id: profile.branch?.id
      };
      
      console.log('✅ ManualFollowUp - User data:', userData);
      return userData;
    } catch (error) {
      console.error('[ERROR] ManualFollowUp - Failed to get userData:', error);
      return null;
    }
  };

  // Fetch templates
  const fetchTemplates = async () => {
    try {
      const userData = await getUserData();
      
      const params = {
        is_active: true,
        limit: 7,
        category: 'followup' // Only get followup templates
      };

      if (userData?.tenant_id) {
        params.tenant_id = userData.tenant_id;
      }

      const { data } = await instance.get('/followup-templates', { params });
      
      if (data.success) {
        setTemplates(data.data.templates || []);
        if (data.data.templates?.length > 0) {
          setSelectedTemplate(data.data.templates[0]);
        }
      }
    } catch (error) {
      console.error('❌ Error fetching templates:', error);
    }
  };

  // Generate message preview
  const generateMessagePreview = (customer, template) => {
    if (!template) return '';
    
    let message = template.template_content || '';
    
    // Replace variables
    message = message.replace(/\{customer_name\}/g, customer.name || 'Customer');
    message = message.replace(/\{business_name\}/g, userProfile?.tenant?.business_name || 'Toko Kami');
    message = message.replace(/\{branch_name\}/g, userProfile?.branch?.name || 'Cabang Utama');
    message = message.replace(/\{days_since_last_order\}/g, customer.days_since_last_order || '0');
    
    return message;
  };

  // Copy message to clipboard
  const handleCopyMessage = async (customer) => {
    if (!selectedTemplate) {
      alert('Pilih template terlebih dahulu');
      return;
    }

    try {
      setCopyingMessage(customer.id);
      
      const message = generateMessagePreview(customer, selectedTemplate);
      
      // Copy to clipboard
      await navigator.clipboard.writeText(message);
      
      // Mark as sent in backend
      await instance.post('/customer-followups/mark-sent', {
        customer_id: customer.id,
        message_content: message,
        template_id: selectedTemplate.id
      });
      
      // Show success feedback
      alert(`✅ Pesan berhasil disalin ke clipboard!\n\nCustomer: ${customer.name}\nTemplate: ${selectedTemplate.title}`);
      
      // Refresh data
      fetchStatistics();
      fetchCustomersByPeriod(selectedPeriod, 1);
      
    } catch (error) {
      console.error('❌ Error copying message:', error);
      alert('❌ Gagal menyalin pesan ke clipboard');
    } finally {
      setCopyingMessage(null);
    }
  };

  // Load more customers
  const handleLoadMore = () => {
    if (currentPage < totalPages && !loadingCustomers) {
      fetchCustomersByPeriod(selectedPeriod, currentPage + 1);
    }
  };

  // Refresh all data
  const handleRefresh = () => {
    fetchStatistics();
    fetchPeriodTabs();
    fetchCustomersByPeriod(selectedPeriod, 1);
  };

  // Handle filter apply
  const handleApplyFilter = () => {
    setShowFilterModal(false);
    setHasFiltered(true);
    fetchCustomersByPeriod(selectedPeriod, 1);
  };

  // Handle preview message
  const handlePreviewMessage = (customer) => {
    if (!selectedTemplate) return;
    
    const preview = generateMessagePreview(customer, selectedTemplate);
    setPreviewContent(preview);
    setPreviewCustomer(customer);
    setShowPreviewModal(true);
  };

  // Handle copy message
  const handleCopyMessage = async (customer) => {
    if (!selectedTemplate) return;
    
    const message = generateMessagePreview(customer, selectedTemplate);
    setCopyingMessage(customer.id);
    
    try {
      await navigator.clipboard.writeText(message);
      
      // Mark as sent
      await instance.post('/customer-followups/mark-sent', {
        customer_id: customer.id,
        message_content: message,
        template_id: selectedTemplate.id
      });
      
      // Remove from list
      setCustomers(prev => prev.filter(c => c.id !== customer.id));
      
      setTimeout(() => setCopyingMessage(null), 2000);
    } catch (error) {
      console.error('Error copying message:', error);
    }
  };

  // Get priority color
  const getPriorityColor = (priority) => {
    const colors = {
      'low': 'bg-green-100 text-green-800 border-green-200',
      'medium': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'high': 'bg-orange-100 text-orange-800 border-orange-200',
      'critical': 'bg-red-100 text-red-800 border-red-200',
      'maximum': 'bg-red-200 text-red-900 border-red-300'
    };
    return colors[priority] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600 font-montserrat">Memuat data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[100dvh] flex flex-col overflow-hidden font-montserrat">
      <HeaderBerandaOwner
        title="Manual Follow-Up"
        description="Follow-up customer manual"
        showBackButton={true}
        fromBerandaOwner={true}
        currentTime={new Date().toLocaleTimeString()}
      />

      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto md:px-10 pt-16">
          <div className="max-w-[390px] md:max-w-none mx-auto space-y-6">

            {/* Statistics Dashboard */}
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-800 font-montserrat tracking-wide">
                  📊 Statistik Follow-Up
                </h2>
                {loadingStatistics && (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <MessageSquare className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-800">Pesan Terkirim</span>
                  </div>
                  <p className="text-lg font-semibold font-bold text-blue-900">
                    {statistics.total_sent_this_month}
                  </p>
                </div>

                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <Users className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-medium text-green-800">Customer Dihubungi</span>
                  </div>
                  <p className="text-lg font-semibold font-bold text-green-900">
                    {statistics.total_customers_contacted}
                  </p>
                </div>

                <div className="bg-orange-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <TrendingUp className="w-4 h-4 text-orange-600" />
                    <span className="text-sm font-medium text-orange-800">Conversion Rate</span>
                  </div>
                  <p className="text-lg font-semibold font-bold text-orange-900">
                    {statistics.conversion_rate}%
                  </p>
                </div>

                <div className="bg-purple-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <BarChart3 className="w-4 h-4 text-purple-600" />
                    <span className="text-sm font-medium text-purple-800">Revenue</span>
                  </div>
                  <p className="text-lg font-bold text-purple-900">
                    {formatCurrency(statistics.revenue_from_followup)}
                  </p>
                </div>
              </div>
            </div>

            {/* WA Template Button */}
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <MessageSquare className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800">Template WhatsApp</h3>
                    <p className="text-sm text-gray-600">Kelola template untuk follow-up customer</p>
                  </div>
                </div>
                <AnimatedButton
                  onClick={() => navigate('/followup/templates')}
                  className="px-4 py-2 rounded-lg text-sm bg-green-500 hover:bg-green-600 text-white flex items-center gap-2"
                  variant="green"
                >
                  <MessageSquare className="w-4 h-4" />
                  Kelola Template
                </AnimatedButton>
              </div>
            </div>

            {/* Period Tabs */}
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <h2 className="text-lg font-bold text-gray-800 font-montserrat tracking-wide mb-4">
                🏷️ Filter Periode Dormant
              </h2>

              {loadingTabs ? (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto"></div>
                  <p className="mt-2 text-sm text-gray-600">Memuat periode...</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {periodTabs.map((tab) => (
                    <AnimatedButton
                      key={tab.period}
                      onClick={() => setSelectedPeriod(tab.period)}
                      className={`p-3 rounded-lg text-sm font-medium transition-colors ${
                        selectedPeriod === tab.period
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                      variant={selectedPeriod === tab.period ? "blue" : "gray"}
                    >
                      <div className="text-center">
                        <div className="font-bold">{tab.period} hari</div>
                        <div className="text-xs opacity-75">{tab.count} customer</div>
                      </div>
                    </AnimatedButton>
                  ))}
                </div>
              )}
            </div>

            {/* Template Selection */}
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <h2 className="text-lg font-bold text-gray-800 font-montserrat tracking-wide mb-4">
                📝 Pilih Template
              </h2>

              <div className="space-y-3">
                {templates.map((template) => (
                  <div
                    key={template.id}
                    onClick={() => setSelectedTemplate(template)}
                    className={`p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                      selectedTemplate?.id === template.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium text-gray-800">{template.title}</h3>
                        <p className="text-sm text-gray-600">{template.category}</p>
                      </div>
                      {selectedTemplate?.id === template.id && (
                        <CheckCircle className="w-5 h-5 text-blue-500" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Customer List */}
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-800 font-montserrat tracking-wide">
                  👥 Customer Ready Follow-Up
                </h2>
                <div className="text-sm text-gray-600">
                  {totalItems} customer
                </div>
              </div>

              {loadingCustomers ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                  <p className="mt-2 text-gray-600">Memuat customer...</p>
                </div>
              ) : customers.length === 0 ? (
                <div className="text-center py-8">
                  <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600">Tidak ada customer di periode ini</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {customers.map((customer) => (
                    <div key={customer.id} className="p-4 rounded-lg border border-gray-200 bg-gray-50">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold text-gray-800">{customer.name}</h3>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(customer.priority)}`}>
                              {customer.priority}
                            </span>
                            {customer.current_membership && (
                              <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getMembershipBadgeColor(customer.current_membership.membership?.name)}`}>
                                <Crown className="w-3 h-3" />
                                {customer.current_membership.membership?.name}
                              </span>
                            )}
                          </div>

                          <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 mb-2">
                            <div className="flex items-center gap-1">
                              <Phone className="w-3 h-3" />
                              <span>{customer.phone}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              <span>{formatDate(customer.last_order_date)}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              <span>{customer.days_since_last_order} hari</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              <span>{customer.branch_name}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Message Preview */}
                      {selectedTemplate && (
                        <div className="mb-3 p-3 bg-white rounded border">
                          <p className="text-xs text-gray-500 mb-1">Preview Pesan:</p>
                          <p className="text-sm text-gray-700">
                            {generateMessagePreview(customer, selectedTemplate)}
                          </p>
                        </div>
                      )}

                      {/* Action Button */}
                      <div className="flex justify-end">
                        <AnimatedButton
                          onClick={() => handleCopyMessage(customer)}
                          disabled={!selectedTemplate || copyingMessage === customer.id}
                          className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center gap-2 disabled:opacity-50"
                          variant="green"
                        >
                          {copyingMessage === customer.id ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                              Menyalin...
                            </>
                          ) : (
                            <>
                              <Copy className="w-4 h-4" />
                              Copy Pesan
                            </>
                          )}
                        </AnimatedButton>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Load More Button */}
              {currentPage < totalPages && (
                <div className="mt-4 flex justify-center">
                  <AnimatedButton
                    onClick={handleLoadMore}
                    disabled={loadingCustomers}
                    className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white px-6 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
                    variant="blue"
                  >
                    {loadingCustomers ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Memuat...
                      </>
                    ) : (
                      'Muat Lebih Banyak'
                    )}
                  </AnimatedButton>
                </div>
              )}
            </div>

          </div>
        </div>
      </main>
    </div>
  );
};

export default ManualFollowUp;