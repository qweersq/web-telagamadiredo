import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Clock,
  Phone,
  MessageSquare,
  Copy,
  CheckCircle,
  Filter,
  Eye,
  Send,
  History,
  RefreshCw
} from 'lucide-react';
import HeaderBerandaOwner from '../../components/Com Header/HeaderBerandaOwner';
import AnimatedButton from '../../components/Design/AnimatedButton';
import HelpTooltip from '../../components/WhatsAppTemplate/HelpTooltip';
import FollowUpHistoryModal from '../../components/Modal/FollowUpHistoryModal';
import instance from '../../config/api';
import { getUserProfile, getTenantBusinessName } from '../../utils/userProfileHelper';
import { formatPriorityStatus, getPriorityStatusColors, getPriorityStatusIcon } from '../../utils/labelFormatter';

const ManualFollowUpSimple = () => {
  const navigate = useNavigate();
  
  // State untuk data
  const [customers, setCustomers] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [periodTabs, setPeriodTabs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [copyingMessage, setCopyingMessage] = useState(null);
  
  // State untuk pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  
  // State untuk tracking sent messages
  const [sentMessages, setSentMessages] = useState(new Set());
  const [showReloadButton, setShowReloadButton] = useState(false);
  
  // Load sent messages from localStorage on component mount
  useEffect(() => {
    const savedSentMessages = localStorage.getItem('sentMessages');
    if (savedSentMessages) {
      const parsedMessages = JSON.parse(savedSentMessages);
      setSentMessages(new Set(parsedMessages));
      if (parsedMessages.length > 0) {
        setShowReloadButton(true);
      }
    }
  }, []);

  // Clear localStorage on page refresh or component unmount
  useEffect(() => {
    const handleBeforeUnload = () => {
      localStorage.removeItem('sentMessages');
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        localStorage.removeItem('sentMessages');
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);
  
  // State untuk filter dan modal
  const [selectedPeriod, setSelectedPeriod] = useState('20-30');
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewContent, setPreviewContent] = useState('');
  const [previewCustomer, setPreviewCustomer] = useState(null);
  const [hasFiltered, setHasFiltered] = useState(false);
  
  // State untuk modal kirim
  const [showSendModal, setShowSendModal] = useState(false);
  const [selectedCustomerForSend, setSelectedCustomerForSend] = useState(null);
  
  // State untuk user data
  const [tenantId, setTenantId] = useState(null);
  const [branchId, setBranchId] = useState(null);
  const [businessName, setBusinessName] = useState('NAMA_BISNIS');
  
  // State untuk modal penjelasan

  // State untuk modal riwayat follow-up
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  // Get user data helper
  const getUserData = async () => {
    try {
      const profile = await getUserProfile();
      if (!profile) return null;
      
      return {
        id: profile.user?.id,
        tenant_id: profile.tenant?.id,
        branch_id: profile.branch?.id
      };
    } catch (error) {
      console.error('[ERROR] ManualFollowUp - Failed to get userData:', error);
      return null;
    }
  };

  // Fetch period tabs
  const fetchPeriodTabs = async () => {
    try {
      const { data } = await instance.get('/customers/dormant-tabs');
      if (data.success) {
        setPeriodTabs(data.data.tabs || []);
      }
    } catch (error) {
      console.error('❌ Error fetching period tabs:', error);
    }
  };

  // Fetch templates
  const fetchTemplates = async () => {
    try {
      const userData = await getUserData();
      
      const params = {
        is_active: true,
        limit: 7,
        category: 'followup'
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

  // Fetch customers by period
  const fetchCustomersByPeriod = async (period, page = 1, append = false) => {
    try {
      if (page === 1) {
        setLoadingCustomers(true);
      } else {
        setLoadingMore(true);
      }
      
      console.log('🔍 Frontend - Fetching customers for period:', period, 'page:', page);
      const encodedPeriod = encodeURIComponent(period);
      const url = `/customers/dormant-by-period?period=${encodedPeriod}&page=${page}&limit=20`;
      console.log('🔍 Frontend - URL:', url);
      console.log('🔍 Frontend - Encoded period:', encodedPeriod);
      
      const { data } = await instance.get(url);
      
      console.log('🔍 Frontend - Response received:', data);
      
      if (data.success) {
        const newCustomers = data.data.customers || [];
        const pagination = data.data.pagination || {};
        
        console.log('🔍 Frontend - Pagination:', pagination);
        console.log('🔍 Frontend - Customers count:', newCustomers.length);
        
        if (append) {
          setCustomers(prev => [...prev, ...newCustomers]);
        } else {
          setCustomers(newCustomers);
        }
        
        setCurrentPage(pagination.currentPage || page);
        setTotalPages(pagination.totalPages || 1);
        setTotalItems(pagination.totalItems || 0);
        setHasMore((pagination.currentPage || page) < (pagination.totalPages || 1));
      }
    } catch (error) {
      console.error('❌ Error fetching customers by period:', error);
    } finally {
      setLoadingCustomers(false);
      setLoadingMore(false);
    }
  };

  // Generate message preview
  const generateMessagePreview = (customer, template) => {
    if (!template) return '';
    
    let message = template.template_content || '';
    
    // Replace variables
    const variables = {
      customer_name: customer.name || 'Customer',
      business_name: businessName,
      branch_name: customer.branch_name || 'Jakarta',
      days_since_last_order: customer.days_since_last_order || '0',
      last_order_date: customer.last_order_date || '',
      total_orders: customer.total_orders || '0'
    };
    
    Object.keys(variables).forEach(key => {
      const regex = new RegExp(`{${key}}`, 'g');
      message = message.replace(regex, variables[key]);
    });
    
    return message;
  };

  // Handle filter apply
  const handleApplyFilter = () => {
    setShowFilterModal(false);
    setHasFiltered(true);
    setCurrentPage(1);
    fetchCustomersByPeriod(selectedPeriod, 1, false);
  };

  // Handle load more
  const handleLoadMore = () => {
    if (hasMore && !loadingMore) {
      const nextPage = currentPage + 1;
      fetchCustomersByPeriod(selectedPeriod, nextPage, true);
    }
  };

  // Handle reload data
  const handleReloadData = async () => {
    setSentMessages(new Set());
    setShowReloadButton(false);
    setCurrentPage(1);
    
    // Clear localStorage
    localStorage.removeItem('sentMessages');
    
    // Refresh both period tabs and customers
    await Promise.all([
      fetchPeriodTabs(),
      fetchCustomersByPeriod(selectedPeriod, 1, false)
    ]);
  };

  // Handle preview message
  const handlePreviewMessage = (customer) => {
    if (!selectedTemplate) return;
    
    const preview = generateMessagePreview(customer, selectedTemplate);
    setPreviewContent(preview);
    setPreviewCustomer(customer);
    setShowPreviewModal(true);
  };

  // Handle open send modal
  const handleOpenSendModal = (customer) => {
    setSelectedCustomerForSend(customer);
    setShowSendModal(true);
  };

  // Handle copy message
  const handleCopyMessage = async (customer, closeModal = true) => {
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
      
      // Add to sent messages tracking (don't remove from list yet)
      const newSentMessages = new Set([...sentMessages, customer.id]);
      setSentMessages(newSentMessages);
      setShowReloadButton(true);
      
      // Save to localStorage
      localStorage.setItem('sentMessages', JSON.stringify([...newSentMessages]));
      
      // Close modal if requested
      if (closeModal) {
        setShowSendModal(false);
      }
      
      setTimeout(() => setCopyingMessage(null), 2000);
    } catch (error) {
      console.error('Error copying message:', error);
    }
  };

  // Handle open WhatsApp - type: 'web' or 'app'
  const handleOpenWhatsApp = async (customer, type = 'web') => {
    if (!selectedTemplate) return;
    
    const message = generateMessagePreview(customer, selectedTemplate);
    const phoneNumber = customer.phone.replace(/\D/g, ''); // Remove non-digits
    
    // Different URL for web vs app
    let whatsappUrl;
    if (type === 'web') {
      whatsappUrl = `https://web.whatsapp.com/send?phone=${phoneNumber}&text=${encodeURIComponent(message)}`;
    } else {
      // For mobile app (works on mobile devices)
      whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
    }
    
    // Mark as sent
    try {
      await instance.post('/customer-followups/mark-sent', {
        customer_id: customer.id,
        message_content: message,
        template_id: selectedTemplate.id
      });
      
      // Add to sent messages (same as copy message)
      const newSentMessages = new Set(sentMessages);
      newSentMessages.add(customer.id);
      setSentMessages(newSentMessages);
      
      // Save to localStorage
      localStorage.setItem('sentMessages', JSON.stringify([...newSentMessages]));
      
      // Show reload button
      setShowReloadButton(true);
      
      // Close modal
      setShowSendModal(false);
      
      // Open WhatsApp
      window.open(whatsappUrl, '_blank');
    } catch (error) {
      console.error('Error opening WhatsApp:', error);
      // Still open WhatsApp even if API fails
      window.open(whatsappUrl, '_blank');
      setShowSendModal(false);
    }
  };

  // Get priority color using label formatter
  const getPriorityColor = (priority) => {
    return getPriorityStatusColors(priority);
  };

  // Handle explanation modal confirmation

  // Handle explanation modal close

  // Truncate customer name to 2 words max
  const truncateCustomerName = (name) => {
    if (!name) return '';
    const words = name.split(' ');
    if (words.length <= 2) return name;
    return words.slice(0, 2).join(' ') + '...';
  };

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  // Load initial data
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const profile = await getUserProfile();
        if (profile?.tenant?.id) {
          setTenantId(profile.tenant.id);
        }
        if (profile?.branch?.id) {
          setBranchId(profile.branch.id);
        }

        // Get business name for dynamic template variables
        const tenantBusinessName = await getTenantBusinessName();
        if (tenantBusinessName) {
          setBusinessName(tenantBusinessName);
        }

        await Promise.all([
          fetchPeriodTabs(),
          fetchTemplates()
        ]);
      } catch (error) {
        console.error('❌ Error loading initial data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
  }, []);

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

      <main className="flex-1 overflow-y-auto mt-24">
        <div className="mx-auto md:px-10">
          <div className="max-w-[390px] md:max-w-none mx-auto space-y-6">

            {/* Action Buttons - Tokopedia Style */}
            <div className="mb-6 flex gap-2 md:gap-3">
              {/* Filter Button - Primary */}
              <button
                onClick={() => {
                  console.log('🔄 Filter button clicked');
                  setShowFilterModal(true);
                }}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-semibold text-sm shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]"
              >
                <div className="w-6 h-6 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                  <Filter className="w-3 h-3" />
                </div>
                <span>Pilih Filter Follow-Up</span>
              </button>

              {/* Riwayat Button - Secondary */}
              <button
                onClick={() => setShowHistoryModal(true)}
                className="shrink-0 px-3 py-2.5 bg-white border-2 border-gray-200 text-gray-700 rounded-xl font-semibold text-sm hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 hover:shadow-md transition-all duration-300 flex items-center justify-center gap-1.5"
                title="Riwayat Follow-Up Customer"
              >
                <History className="w-4 h-4" />
                <span className="hidden sm:inline">Riwayat</span>
              </button>

            </div>

            {/* Info Card - Only show when no filter applied */}
            {!hasFiltered && (
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <div className="text-center">
                  <h2 className="text-xl font-bold text-gray-800 mb-2">Pilih Customer untuk Follow-Up</h2>
                  <div className="text-gray-600 mb-6 max-w-2xl mx-auto">
                    <p className="mb-3">
                      <strong>Periode</strong> = Berapa lama customer belum order lagi (misal: 30 hari = terakhir order 30 hari yang lalu)
                    </p>
                    <p className="mb-3">
                      <strong>Template</strong> = Pesan WhatsApp yang sudah disiapkan untuk mengingatkan customer
                    </p>
                    <p className="text-sm text-gray-500 bg-gray-50 p-3 rounded-lg">
                      💡 <strong>Cara pakai:</strong> Pilih periode → Pilih template → Lihat daftar customer → Klik Copy untuk salin pesan → Kirim manual di WhatsApp
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Customer List */}
            {hasFiltered && (
              <div className="bg-white rounded-2xl shadow-sm">
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-bold text-gray-800">Data Customer</h3>
                    <div className="flex items-center gap-2">
                      <AnimatedButton
                        onClick={() => setShowFilterModal(true)}
                        className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md"
                      >
                        Ubah Filter
                      </AnimatedButton>
                    </div>
                  </div>
                  
                  {/* Period Info */}
                  <div className="flex items-start justify-between">
                    <div className="flex flex-col gap-1">
                      <span className="text-xs text-gray-600">
                        Periode: {selectedPeriod} hari
                      </span>
                      {selectedTemplate && (
                        <span className="text-xs text-gray-500">
                          Template: {selectedTemplate.title}
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {/* Reload Button */}
                      {showReloadButton && (
                        <AnimatedButton
                          onClick={handleReloadData}
                          className="px-3 py-1 text-xs bg-green-500 hover:bg-green-600 text-white rounded-md flex items-center gap-1"
                        >
                          <RefreshCw className="w-3 h-3" />
                          Reload ({sentMessages.size})
                        </AnimatedButton>
                      )}
                    </div>
                  </div>
                </div>

                <div className="divide-y divide-gray-200">
                  {loadingCustomers ? (
                    <div className="p-8 text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                      <p className="mt-2 text-gray-600">Memuat customer...</p>
                    </div>
                  ) : customers.length > 0 ? (
                    customers.map((customer) => (
                      <div key={customer.id} className="p-4 hover:bg-gray-50">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2 flex-wrap">
                              <h4 className="font-semibold text-gray-800 truncate">
                                {truncateCustomerName(customer.name)}
                              </h4>
                              {sentMessages.has(customer.id) && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                  Terkirim
                                </span>
                              )}
                            </div>
                            
                            <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                              <div className="flex items-center gap-1">
                                <Phone className="w-3 h-3" />
                                <span>{customer.phone}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                <span>{customer.days_since_last_order} hari</span>
                              </div>
                            </div>
                            
                            <div className="text-xs text-gray-500 space-y-0.5">
                              <p>Order terakhir: {formatDate(customer.last_order_date)}</p>
                              <p className="text-gray-400">
                                {customer.total_orders || 0} transaksi • {customer.total_order_details || 0} items
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex flex-col gap-1.5 ml-4">
                            <AnimatedButton
                              onClick={() => handlePreviewMessage(customer)}
                              className="flex items-center gap-1.5 px-3 py-2 text-blue-600 hover:bg-blue-50 rounded-md border border-blue-200"
                              title="Preview pesan"
                            >
                              <Eye className="w-4 h-4" />
                              <span className="text-xs font-medium">Preview</span>
                            </AnimatedButton>
                            
                            <AnimatedButton
                              onClick={() => handleOpenSendModal(customer)}
                              className="flex items-center gap-1.5 px-3 py-2 text-white bg-green-600 hover:bg-green-700 rounded-md border border-green-600"
                              title="Kirim pesan"
                            >
                              <Send className="w-4 h-4" />
                              <span className="text-xs font-medium">Kirim</span>
                            </AnimatedButton>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-8 text-center">
                      <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-700 mb-2">
                        Tidak Ada Customer
                      </h3>
                      <p className="text-gray-600">
                        Tidak ada customer yang perlu di-follow up untuk periode ini
                      </p>
                    </div>
                  )}
                </div>

                {/* Load More Button */}
                {hasMore && customers.length > 0 && (
                  <div className="p-4 border-t border-gray-200">
                    <AnimatedButton
                      onClick={handleLoadMore}
                      disabled={loadingMore}
                      className="w-full px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {loadingMore ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          <span>Memuat...</span>
                        </>
                      ) : (
                        <>
                          <span>Load More</span>
                          <span className="text-xs opacity-75">
                            ({customers.length} dari {totalItems})
                          </span>
                        </>
                      )}
                    </AnimatedButton>
                  </div>
                )}

              </div>
            )}

          </div>
        </div>
      </main>

      {/* Filter Modal */}
      {showFilterModal && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          style={{
            paddingTop: 'max(1rem, env(safe-area-inset-top))',
            paddingBottom: 'max(1rem, env(safe-area-inset-bottom))',
            paddingLeft: 'max(1rem, env(safe-area-inset-left))',
            paddingRight: 'max(1rem, env(safe-area-inset-right))'
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowFilterModal(false);
            }
          }}
        >
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full flex flex-col max-h-[85vh]">
            <div className="p-6 border-b-2 border-gray-100 flex-shrink-0 rounded-t-2xl">
              <h3 className="text-lg font-semibold text-gray-800">Pilih Filter</h3>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-6" style={{ WebkitOverflowScrolling: 'touch', overscrollBehavior: 'contain' }}>
              {/* Period Selection */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <label className="text-sm font-medium text-gray-700">
                    Periode Dormant
                  </label>
                  <HelpTooltip
                    title="Apa itu Periode Dormant?"
                    content={
                      <div className="space-y-3">
                        <p>
                          <strong>Dormant</strong> = Customer yang sudah lama tidak order lagi
                        </p>
                        <div className="space-y-2">
                          <p><strong>20-30 hari:</strong> Customer terakhir order 20-30 hari yang lalu</p>
                          <p><strong>30-40 hari:</strong> Customer terakhir order 30-40 hari yang lalu</p>
                          <p><strong>40-50 hari:</strong> Customer terakhir order 40-50 hari yang lalu</p>
                          <p><strong>50-60 hari:</strong> Customer terakhir order 50-60 hari yang lalu</p>
                          <p><strong>60-70 hari:</strong> Customer terakhir order 60-70 hari yang lalu</p>
                          <p><strong>70-80 hari:</strong> Customer terakhir order 70-80 hari yang lalu</p>
                          <p><strong>80-90 hari:</strong> Customer terakhir order 80-90 hari yang lalu</p>
                          <p><strong>90+ hari:</strong> Customer terakhir order lebih dari 90 hari yang lalu</p>
                        </div>
                        <p className="text-blue-600 font-medium">
                          💡 Semakin lama tidak order, semakin penting untuk di-follow up!
                        </p>
                      </div>
                    }
                    size="lg"
                  />
                </div>
                
                {periodTabs.length === 0 ? (
                  <div className="bg-gray-50 rounded-lg p-3 text-center">
                    <p className="text-sm text-gray-600">Lakukan order terlebih dahulu</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    {periodTabs.map((tab) => (
                      <button
                        key={tab.period}
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          console.log('🔄 Period clicked:', tab.period);
                          setSelectedPeriod(tab.period);
                        }}
                        className={`p-3 rounded-lg border text-sm font-medium transition-colors cursor-pointer ${
                          selectedPeriod === tab.period
                            ? 'bg-blue-500 text-white border-blue-500'
                            : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                        }`}
                      >
                        <div className="text-center">
                          <div className="font-bold">{tab.period} hari</div>
                          <div className="text-xs opacity-75">{tab.count} customer</div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Template Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Template WhatsApp
                </label>
                
                {templates.length === 0 ? (
                  <div className="bg-gray-50 rounded-lg p-3 text-center">
                    <p className="text-sm text-gray-600">Buat template WhatsApp terlebih dahulu</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {templates.map((template) => (
                      <div
                        key={template.id}
                        className={`w-full p-3 rounded-lg border transition-colors ${
                          selectedTemplate?.id === template.id
                            ? 'bg-green-500 text-white border-green-500'
                            : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              console.log('🔄 Template clicked:', template.title);
                              setSelectedTemplate(template);
                            }}
                            className="flex-1 text-left cursor-pointer min-w-0"
                          >
                            <div className="font-medium truncate">{template.title}</div>
                            <div className="text-xs opacity-75 truncate">
                              {template.description}
                            </div>
                          </button>
                          
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              console.log('🔄 Template preview clicked:', template.title);
                              handlePreviewMessage({ 
                                name: 'Sample Customer', 
                                phone: '081234567890',
                                days_since_last_order: '15',
                                last_order_date: '2025-09-14',
                                total_orders: '3',
                                branch_name: 'Jakarta'
                              });
                            }}
                            className={`ml-2 p-1.5 rounded-md transition-colors ${
                              selectedTemplate?.id === template.id
                                ? 'text-white hover:bg-green-600'
                                : 'text-gray-500 hover:bg-gray-200'
                            }`}
                            title="Preview template"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex-shrink-0 p-6 border-t-2 border-gray-100 bg-white rounded-b-2xl flex gap-3">
              <AnimatedButton
                onClick={() => setShowFilterModal(false)}
                className="flex-1 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
              >
                Batal
              </AnimatedButton>
              <AnimatedButton
                onClick={() => {
                  console.log('🔄 Apply filter clicked');
                  console.log('Selected period:', selectedPeriod);
                  console.log('Selected template:', selectedTemplate);
                  handleApplyFilter();
                }}
                disabled={!selectedTemplate || periodTabs.length === 0 || templates.length === 0}
                className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
              >
                Terapkan
              </AnimatedButton>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {showPreviewModal && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          style={{
            paddingTop: 'max(1rem, env(safe-area-inset-top))',
            paddingBottom: 'max(1rem, env(safe-area-inset-bottom))',
            paddingLeft: 'max(1rem, env(safe-area-inset-left))',
            paddingRight: 'max(1rem, env(safe-area-inset-right))'
          }}
        >
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full flex flex-col max-h-[85vh]">
            <div className="p-6 border-b-2 border-gray-100 flex-shrink-0 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-800">Preview Pesan</h3>
                <button
                  onClick={() => setShowPreviewModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  ✕
                </button>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6" style={{ WebkitOverflowScrolling: 'touch', overscrollBehavior: 'contain' }}>
              <div className="mb-4">
                <h4 className="font-medium text-gray-700 mb-2">
                  Untuk: {previewCustomer?.name}
                </h4>
                <p className="text-sm text-gray-500">
                  Template: {selectedTemplate?.title}
                </p>
              </div>
              
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="whitespace-pre-wrap text-sm text-gray-800">
                  {previewContent}
                </div>
              </div>
            </div>
            
            <div className="flex-shrink-0 p-6 border-t-2 border-gray-100 bg-white rounded-b-2xl flex gap-3">
              <AnimatedButton
                onClick={() => setShowPreviewModal(false)}
                className="flex-1 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
              >
                Tutup
              </AnimatedButton>
            </div>
          </div>
        </div>
      )}

      {/* Send Options Modal - Minimalist Design */}
      {showSendModal && selectedCustomerForSend && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          style={{
            paddingTop: 'max(1rem, env(safe-area-inset-top))',
            paddingBottom: 'max(1rem, env(safe-area-inset-bottom))',
            paddingLeft: 'max(1rem, env(safe-area-inset-left))',
            paddingRight: 'max(1rem, env(safe-area-inset-right))'
          }}
        >
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full flex flex-col max-h-[85vh]">
            {/* Header */}
            <div className="px-6 py-5 border-b-2 border-gray-100 flex-shrink-0 rounded-t-2xl">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">Pilih Cara Kirim</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Untuk: <span className="font-medium text-gray-700">{truncateCustomerName(selectedCustomerForSend.name)}</span>
                  </p>
                </div>
                <button
                  onClick={() => setShowSendModal(false)}
                  className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            {/* Options */}
            <div className="p-6 space-y-3 flex-1 overflow-y-auto" style={{ WebkitOverflowScrolling: 'touch', overscrollBehavior: 'contain' }}>
              {/* WhatsApp Web Button */}
              <AnimatedButton
                onClick={() => handleOpenWhatsApp(selectedCustomerForSend, 'web')}
                className="w-full flex items-center gap-4 px-5 py-4 bg-white hover:bg-gray-50 border-2 border-gray-200 hover:border-green-500 rounded-xl transition-all duration-200 group"
              >
                <div className="flex-shrink-0 w-11 h-11 bg-green-50 group-hover:bg-green-100 rounded-lg flex items-center justify-center transition-colors">
                  <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                  </svg>
                </div>
                <div className="flex-1 text-left">
                  <div className="text-sm font-semibold text-gray-900 group-hover:text-green-700 transition-colors">WhatsApp Web</div>
                  <div className="text-xs text-gray-500 mt-0.5">Buka di browser desktop</div>
                </div>
                <svg className="w-5 h-5 text-gray-400 group-hover:text-green-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </AnimatedButton>

              {/* WhatsApp Apps Button */}
              <AnimatedButton
                onClick={() => handleOpenWhatsApp(selectedCustomerForSend, 'app')}
                className="w-full flex items-center gap-4 px-5 py-4 bg-white hover:bg-gray-50 border-2 border-gray-200 hover:border-blue-500 rounded-xl transition-all duration-200 group"
              >
                <div className="flex-shrink-0 w-11 h-11 bg-blue-50 group-hover:bg-blue-100 rounded-lg flex items-center justify-center transition-colors">
                  <MessageSquare className="w-6 h-6 text-blue-600" />
                </div>
                <div className="flex-1 text-left">
                  <div className="text-sm font-semibold text-gray-900 group-hover:text-blue-700 transition-colors">WhatsApp Apps</div>
                  <div className="text-xs text-gray-500 mt-0.5">Buka aplikasi WhatsApp</div>
                </div>
                <svg className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </AnimatedButton>

              {/* Copy Message Button */}
              <AnimatedButton
                onClick={() => handleCopyMessage(selectedCustomerForSend)}
                disabled={copyingMessage === selectedCustomerForSend.id}
                className={`w-full flex items-center gap-4 px-5 py-4 border-2 rounded-xl transition-all duration-200 group ${
                  copyingMessage === selectedCustomerForSend.id
                    ? 'bg-gray-50 border-gray-300 cursor-not-allowed'
                    : 'bg-white hover:bg-gray-50 border-gray-200 hover:border-gray-500'
                }`}
              >
                <div className={`flex-shrink-0 w-11 h-11 rounded-lg flex items-center justify-center transition-colors ${
                  copyingMessage === selectedCustomerForSend.id
                    ? 'bg-green-100'
                    : 'bg-gray-50 group-hover:bg-gray-100'
                }`}>
                  {copyingMessage === selectedCustomerForSend.id ? (
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  ) : (
                    <Copy className="w-6 h-6 text-gray-600" />
                  )}
                </div>
                <div className="flex-1 text-left">
                  <div className={`text-sm font-semibold transition-colors ${
                    copyingMessage === selectedCustomerForSend.id
                      ? 'text-green-700'
                      : 'text-gray-900 group-hover:text-gray-700'
                  }`}>
                    {copyingMessage === selectedCustomerForSend.id ? 'Pesan Tersalin!' : 'Salin Pesan'}
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5">
                    {copyingMessage === selectedCustomerForSend.id ? 'Silahkan paste di WhatsApp' : 'Copy ke clipboard'}
                  </div>
                </div>
                {!copyingMessage && (
                  <svg className="w-5 h-5 text-gray-400 group-hover:text-gray-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                )}
              </AnimatedButton>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-gray-50 border-t-2 border-gray-100 flex-shrink-0 rounded-b-2xl">
              <AnimatedButton
                onClick={() => setShowSendModal(false)}
                className="w-full px-4 py-2.5 bg-white hover:bg-gray-100 text-gray-700 border border-gray-300 hover:border-gray-400 rounded-lg font-medium transition-all duration-200"
              >
                Batal
              </AnimatedButton>
            </div>
          </div>
        </div>
      )}

      {/* Riwayat Follow-Up Modal */}
      <FollowUpHistoryModal
        isOpen={showHistoryModal}
        onClose={() => setShowHistoryModal(false)}
      />
    </div>
  );
};

export default ManualFollowUpSimple;
