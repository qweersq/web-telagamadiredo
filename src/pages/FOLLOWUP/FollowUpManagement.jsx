import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Filter,
  Users,
  Clock,
  Calendar,
  Phone,
  MessageSquare,
  Send,
  CheckCircle,
  AlertCircle,
  Crown,
  MapPin,
  User
} from 'lucide-react';
import HeaderBerandaOwner from '../../components/Com Header/HeaderBerandaOwner';
import AnimatedButton from '../../components/Design/AnimatedButton';
import instance from '../../config/api';
import { getUserProfile } from '../../utils/userProfileHelper';
import { getMembershipBadgeColor, getMembershipDiscountDisplay } from '../../utils/labelFormatter';

const FollowUpManagement = () => {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCustomers, setSelectedCustomers] = useState([]);
  const [daysFilter, setDaysFilter] = useState(14);
  const [searchTerm, setSearchTerm] = useState('');
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [messageTemplate, setMessageTemplate] = useState('');
  const [sendingMessages, setSendingMessages] = useState(false);
  const [sendingProgress, setSendingProgress] = useState(0);
  const [currentProcessingCustomer, setCurrentProcessingCustomer] = useState(null);
  const [tenantId, setTenantId] = useState(null);
  const [branchId, setBranchId] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [showCustomerListModal, setShowCustomerListModal] = useState(false);
  const [loadingMoreCustomers, setLoadingMoreCustomers] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [followupHistory, setFollowupHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyLoadingMore, setHistoryLoadingMore] = useState(false);
  const [historyCurrentPage, setHistoryCurrentPage] = useState(1);
  const [historyTotalPages, setHistoryTotalPages] = useState(1);
  const [historyTotalItems, setHistoryTotalItems] = useState(0);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Modal pagination state
  const [modalCurrentPage, setModalCurrentPage] = useState(1);
  const [modalTotalPages, setModalTotalPages] = useState(1);
  const [modalCustomers, setModalCustomers] = useState([]);

  // Fetch user data
  useEffect(() => {
    const loadUserData = async () => {
      try {
        const profile = await getUserProfile();
        if (profile?.tenant?.id) {
          setTenantId(profile.tenant.id);
        }
        if (profile?.branch?.id) {
          setBranchId(profile.branch.id);
        }
      } catch (error) {
        console.error('❌ FollowUpManagement - Failed to load user data:', error);
      }
    };

    loadUserData();
  }, []);

  // Fetch dormant customers
  useEffect(() => {
    if (tenantId) {
      fetchDormantCustomers();
    }
  }, [tenantId, daysFilter, currentPage]);

  // Fetch modal customers when modal opens
  useEffect(() => {
    if (showCustomerListModal && tenantId) {
      setModalCurrentPage(1);
      fetchModalCustomers(1, false);
    }
  }, [showCustomerListModal, tenantId, daysFilter]);

  const fetchDormantCustomers = async () => {
    try {
      setLoading(true);
      const { data } = await instance.get(`/customers/dormant?days=${daysFilter}&page=${currentPage}&limit=20`);

      if (data.success) {
        setCustomers(data.data.customers || []);
        setTotalPages(data.data.pagination.totalPages);
        setTotalItems(data.data.pagination.totalItems);
      }
    } catch (error) {
      console.error('❌ Error fetching dormant customers:', error);
      alert('Gagal memuat data customer');
    } finally {
      setLoading(false);
    }
  };

  const fetchModalCustomers = async (page = 1, append = false) => {
    try {
      if (append) {
        setLoadingMoreCustomers(true);
      } else {
        setLoading(true);
      }

      const { data } = await instance.get(`/customers/dormant?days=${daysFilter}&page=${page}&limit=20`);

      if (data.success) {
        if (append) {
          setModalCustomers(prev => [...prev, ...(data.data.customers || [])]);
        } else {
          setModalCustomers(data.data.customers || []);
        }
        setModalTotalPages(data.data.pagination.totalPages);
        setModalCurrentPage(page);
      }
    } catch (error) {
      console.error('❌ Error fetching modal customers:', error);
      alert('Gagal memuat data customer');
    } finally {
      setLoadingMoreCustomers(false);
      setLoading(false);
    }
  };

  const handleCustomerSelect = (customer) => {
    setSelectedCustomers(prev => {
      const isSelected = prev.find(c => c.id === customer.id);
      if (isSelected) {
        return prev.filter(c => c.id !== customer.id);
      } else {
        // Check if already at maximum limit
        if (prev.length >= 30) {
          alert('Maksimal hanya bisa memilih 30 customer untuk follow-up');
          return prev;
        }
        return [...prev, customer];
      }
    });
  };

  const handleSelectAll = () => {
    if (selectedCustomers.length === modalCustomers.length) {
      setSelectedCustomers([]);
    } else {
      // Limit to maximum 30 customers
      const maxCustomers = Math.min(modalCustomers.length, 30);
      setSelectedCustomers([...modalCustomers.slice(0, maxCustomers)]);
    }
  };

  const handleLoadMoreCustomers = () => {
    if (modalCurrentPage < modalTotalPages && !loadingMoreCustomers) {
      fetchModalCustomers(modalCurrentPage + 1, true);
    }
  };

  const fetchFollowupHistory = async (page = 1, append = false) => {
    try {
      if (append) {
        setHistoryLoadingMore(true);
      } else {
        setHistoryLoading(true);
      }
      
      const { data } = await instance.get(`/customer-followups/history?limit=20&page=${page}`);
      
      if (data.success) {
        if (append) {
          setFollowupHistory(prev => [...prev, ...(data.data.followups || [])]);
        } else {
          setFollowupHistory(data.data.followups || []);
        }
        setHistoryCurrentPage(page);
        setHistoryTotalPages(data.data.pagination?.totalPages || 1);
        setHistoryTotalItems(data.data.pagination?.totalItems || 0);
      }
    } catch (error) {
      console.error('❌ Error fetching followup history:', error);
      alert('Gagal memuat history follow up');
    } finally {
      setHistoryLoadingMore(false);
      setHistoryLoading(false);
    }
  };

  const handleShowHistory = () => {
    setShowHistoryModal(true);
    setHistoryCurrentPage(1);
    fetchFollowupHistory(1, false);
  };

  const handleLoadMoreHistory = () => {
    if (historyCurrentPage < historyTotalPages && !historyLoadingMore) {
      fetchFollowupHistory(historyCurrentPage + 1, true);
    }
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Validate file type (only images)
      if (!file.type.startsWith('image/')) {
        alert('Hanya file gambar yang diperbolehkan (JPG, PNG, GIF, dll)');
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('Ukuran file maksimal 5MB');
        return;
      }
      
      setSelectedFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setFilePreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setFilePreview(null);
  };

  const handleComposeMessage = () => {
    if (selectedCustomers.length === 0) {
      alert('Pilih customer terlebih dahulu');
      return;
    }

    // Default message template
    const defaultMessage = `Halo {customer_name}! 👋

Kami dari {business_name} ingin mengingatkan bahwa sudah {days_since_last_order} hari sejak terakhir kali Anda menggunakan layanan cuci sepatu kami.

Apakah ada yang bisa kami bantu? Kami siap melayani Anda dengan layanan terbaik! ✨

Terima kasih atas kepercayaan Anda. 🙏`;

    setMessageTemplate(defaultMessage);
    setShowMessageModal(true);
  };

  const handleSendMessages = async () => {
    if (!messageTemplate.trim()) {
      alert('Pesan tidak boleh kosong');
      return;
    }

    setSendingMessages(true);
    setSendingProgress(0);

    try {
      console.log(`📱 Sending follow-up messages to ${selectedCustomers.length} customers one by one...`);
      
      let successCount = 0;
      let failedCount = 0;
      const results = [];

      // Send messages one by one with progress tracking
      for (let i = 0; i < selectedCustomers.length; i++) {
        const customer = selectedCustomers[i];
        
        try {
          console.log(`📤 Sending to customer ${i + 1}/${selectedCustomers.length}: ${customer.name}`);
          
          // Update progress and current customer
          const progress = ((i + 1) / selectedCustomers.length) * 100;
          setSendingProgress(progress);
          setCurrentProcessingCustomer(customer.name);
          
          // Prepare form data for file upload
          const formData = new FormData();
          formData.append('customer_ids', JSON.stringify([customer.id]));
          formData.append('message_template', messageTemplate);
          formData.append('branch_id', branchId);
          
          if (selectedFile) {
            formData.append('file', selectedFile);
          }

          // Send single customer follow-up
          const response = await instance.post('/customer-followups/send-messages', formData, {
            timeout: 30000, // 30 seconds timeout per customer
            headers: {
              'Content-Type': 'multipart/form-data'
            }
          });

          const result = response.data.data;
          
          if (result.summary.success > 0) {
            successCount++;
            console.log(`✅ Success: ${customer.name}`);
          } else {
            failedCount++;
            console.error(`❌ Failed: ${customer.name}`);
          }
          
          results.push({
            customer: customer,
            success: result.summary.success > 0,
            result: result
          });

          // Add delay between messages (except for the last one)
          if (i < selectedCustomers.length - 1) {
            console.log(`⏱️ Waiting 1.5 seconds before next message...`);
            await new Promise(resolve => setTimeout(resolve, 1500));
          }

        } catch (error) {
          console.error(`❌ Error sending to ${customer.name}:`, error);
          failedCount++;
          results.push({
            customer: customer,
            success: false,
            error: error.message
          });
        }
      }

      // Show final results
      console.log('📊 Final results:', { successCount, failedCount, results });
      
      if (failedCount > 0) {
        alert(`Follow-up selesai!\n✅ Berhasil: ${successCount}\n❌ Gagal: ${failedCount}\n\nLihat console untuk detail.`);
      } else {
        alert(`🎉 Semua ${successCount} pesan follow-up berhasil dikirim!`);
      }

      // Show failed customers in console for debugging
      const failedCustomers = results.filter(r => !r.success);
      if (failedCustomers.length > 0) {
        console.error('❌ Failed customers:', failedCustomers);
      }

      setShowMessageModal(false);
      setSelectedCustomers([]);
      setMessageTemplate('');
      
      // Refresh customer list to exclude followed up customers
      fetchDormantCustomers();
      fetchModalCustomers(1, false);

    } catch (error) {
      console.error('❌ Error in send messages loop:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Gagal mengirim pesan';
      alert(`❌ Error: ${errorMessage}`);
    } finally {
      setSendingMessages(false);
      setSendingProgress(0);
      setCurrentProcessingCustomer(null);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getDaysFilterOptions = () => [
    { value: 14, label: '14 Hari' },
    { value: 30, label: '30 Hari' },
    { value: 60, label: '60 Hari' },
    { value: 90, label: '90 Hari' }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600 font-montserrat">Memuat data customer...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[100dvh] flex flex-col overflow-hidden font-montserrat">
        <HeaderBerandaOwner
          title="Follow Up Customer"
          description="Follow up customer lama"
          showBackButton={true}
          fromBerandaOwner={true}
          currentTime={new Date().toLocaleTimeString()}
          addButton={
            <AnimatedButton
              onClick={handleShowHistory}
              className="px-4 py-2 rounded-lg text-sm bg-gray-500 hover:bg-gray-600 text-white flex items-center gap-2"
              variant="gray"
            >
              <Clock className="w-4 h-4" />
              History
            </AnimatedButton>
          }
        />

      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto md:px-10 pt-16">
          <div className="max-w-[390px] md:max-w-none mx-auto">

            {/* Filter Section */}
            <div className="bg-white rounded-2xl p-6 shadow-sm">

              <div className="space-y-4">
                {/* Days Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 font-montserrat">
                    Customer yang tidak order selama:
                  </label>
                  <div className="flex flex-wrap gap-1">
                    {getDaysFilterOptions().map(option => (
                      <AnimatedButton
                        key={option.value}
                        onClick={() => setDaysFilter(option.value)}
                        className={`px-4 py-2 rounded-lg text-sm font-montserrat transition-colors ${daysFilter === option.value
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        variant={daysFilter === option.value ? "blue" : "gray"}
                      >
                        {option.label}
                      </AnimatedButton>
                    ))}
                  </div>
                </div>

                {/* Search */}
                {/* <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 font-montserrat">
                    Cari Customer:
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Nama customer..."
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-montserrat"
                    />
                  </div>
                </div> */}
              </div>
            </div>

            {/* Customer Selection */}
            <div className="bg-white rounded-2xl p-6 shadow-sm mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-800 font-montserrat tracking-wide">
                  Pilih Customer
                </h2>
                    <div className="text-sm text-gray-600 font-montserrat">
                      {selectedCustomers.length} dari {totalItems} customer terpilih
                      {selectedCustomers.length >= 30 && (
                        <span className="ml-2 text-red-600 font-medium">
                          (Maksimal 30 customer)
                        </span>
                      )}
                    </div>
              </div>

              <div className="space-y-4">
                <button
                  onClick={() => setShowCustomerListModal(true)}
                  className="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors text-center"
                >
                  <div className="flex items-center justify-center gap-2 text-gray-600">
                    <Users className="w-5 h-5" />
                    <span className="font-montserrat font-medium">
                      {customers.length === 0 ? 'Tidak ada customer' : `Lihat ${customers.length} customer`}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 font-montserrat mt-1">
                    Klik untuk memilih customer yang akan di-follow up
                  </p>
                </button>

                {selectedCustomers.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium text-gray-700 font-montserrat">
                      Customer Terpilih:
                    </h3>
                    <div className="max-h-32 overflow-y-auto space-y-1">
                      {selectedCustomers.map(customer => (
                        <div key={customer.id} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-montserrat">{customer.name}</span>
                            {customer.current_membership && (
                              <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getMembershipBadgeColor(customer.current_membership.membership?.name)}`}>
                                <Crown className="w-3 h-3" />
                                {customer.current_membership.membership?.name}
                              </span>
                            )}
                          </div>
                          <button
                            onClick={() => handleCustomerSelect(customer)}
                            className="text-red-500 hover:text-red-700 text-xs font-montserrat"
                          >
                            Hapus
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <div className="flex justify-center">
                <AnimatedButton
                  onClick={handleComposeMessage}
                  disabled={selectedCustomers.length === 0}
                  className="px-8 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-montserrat font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-400"
                  variant="blue"
                >
                  <MessageSquare className="w-4 h-4" />
                  Kirim Follow Up
                </AnimatedButton>
              </div>

              {selectedCustomers.length === 0 && (
                <p className="text-xs text-gray-500 font-montserrat text-center mt-2">
                  Pilih customer terlebih dahulu untuk mengirim follow up
                </p>
              )}
            </div>

            {/* Customer List Modal */}
            {showCustomerListModal && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-2xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-gray-800 font-montserrat tracking-wide">
                      Pilih Customer untuk Follow Up
                    </h2>

                    <button
                      onClick={() => setShowCustomerListModal(false)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>

                      <div className="text-xs mb-2 text-gray-500 font-montserrat bg-blue-50 px-2 py-1 rounded">
                        Customer diurutkan berdasarkan total layanan terbanyak
                      </div>
                      <div className="text-xs mb-2 text-orange-600 font-montserrat bg-orange-50 px-2 py-1 rounded border border-orange-200">
                        ⚠️ Maksimal hanya bisa memilih 30 customer untuk follow-up
                      </div>
                  <div className="flex items-center justify-between mb-4">

                        <div className="text-sm text-gray-600 font-montserrat">
                          {selectedCustomers.length} dari {modalCustomers.length} customer terpilih
                          {selectedCustomers.length >= 30 && (
                            <span className="ml-2 text-red-600 font-medium">
                              (Maksimal 30 customer)
                            </span>
                          )}
                        </div>
                    <button
                      onClick={handleSelectAll}
                      className="text-sm text-blue-600 hover:text-blue-700 font-montserrat font-medium"
                    >
                      {selectedCustomers.length === modalCustomers.length ? 'Batal Pilih Semua' : 'Pilih Semua'}
                    </button>
                  </div>

                  {modalCustomers.length === 0 ? (
                    <div className="text-center py-8">
                      <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-gray-600 font-montserrat">
                        Tidak ada customer yang ditemukan
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {modalCustomers
                        .filter(customer =>
                          customer.name.toLowerCase().includes(searchTerm.toLowerCase())
                        )
                        .map((customer) => (
                                <div
                                  key={customer.id}
                                  onClick={() => handleCustomerSelect(customer)}
                                  className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                                    selectedCustomers.find(c => c.id === customer.id)
                                      ? 'border-blue-500 bg-blue-50'
                                      : selectedCustomers.length >= 30 && !selectedCustomers.find(c => c.id === customer.id)
                                      ? 'border-gray-200 bg-gray-100 cursor-not-allowed opacity-60'
                                      : 'border-gray-200 hover:border-gray-300'
                                    }`}
                                >
                            <div className="flex items-center gap-3">
                              <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${selectedCustomers.find(c => c.id === customer.id)
                                  ? 'border-blue-500 bg-blue-500'
                                  : 'border-gray-300'
                                }`}>
                                {selectedCustomers.find(c => c.id === customer.id) && (
                                  <CheckCircle className="w-3 h-3 text-white" />
                                )}
                              </div>

                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <h3 className="font-semibold text-gray-800 font-montserrat">
                                    {customer.name}
                                  </h3>
                                  {customer.current_membership && (
                                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getMembershipBadgeColor(customer.current_membership.membership?.name)}`}>
                                      <Crown className="w-3 h-3" />
                                      {customer.current_membership.membership?.name}
                                    </span>
                                  )}
                                </div>

                                <div className="flex items-center gap-4 text-xs text-gray-600 font-montserrat">
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
                                </div>

                                <div className="flex items-center gap-4 text-xs text-gray-500 font-montserrat mt-1">
                                  <div className="flex items-center gap-1">
                                    <Users className="w-3 h-3" />
                                    <span>{customer.total_orders} order</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <CheckCircle className="w-3 h-3" />
                                    <span>{customer.total_order_details} layanan</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <MapPin className="w-3 h-3" />
                                    <span>{customer.branch_name}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  )}

                  {/* Load More Button */}
                  {modalCurrentPage < modalTotalPages && (
                    <div className="mt-4 flex justify-center">
                      <AnimatedButton
                        onClick={handleLoadMoreCustomers}
                        disabled={loadingMoreCustomers}
                        className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white px-6 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
                        variant="blue"
                      >
                        {loadingMoreCustomers ? (
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

                  <div className="flex gap-3 mt-6">
                    <AnimatedButton
                      onClick={() => setShowCustomerListModal(false)}
                      className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-montserrat font-medium"
                      variant="gray"
                    >
                      Tutup
                    </AnimatedButton>
                    <AnimatedButton
                      onClick={() => setShowCustomerListModal(false)}
                      className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-montserrat font-medium"
                      variant="blue"
                    >
                      Selesai Pilih
                    </AnimatedButton>
                  </div>
                </div>
              </div>
            )}

            {/* Message Modal */}
            {showMessageModal && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                  <h2 className="text-xl font-bold text-gray-800 mb-4 font-montserrat tracking-wide">
                    Compose Follow Up Message
                  </h2>

                  <div className="mb-4">
                    <p className="text-sm text-gray-600 font-montserrat mb-2">
                      Pesan akan dikirim ke {selectedCustomers.length} customer:
                    </p>
                    <div className="max-h-32 overflow-y-auto space-y-1">
                      {selectedCustomers.map(customer => (
                        <div key={customer.id} className="text-xs text-gray-500 font-montserrat">
                          • {customer.name} ({customer.phone})
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2 font-montserrat">
                      Template Pesan:
                    </label>
                    <textarea
                      value={messageTemplate}
                      onChange={(e) => setMessageTemplate(e.target.value)}
                      rows={8}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-montserrat"
                      placeholder="Masukkan template pesan..."
                    />
                    <p className="text-xs text-gray-500 font-montserrat mt-1">
                      Gunakan {`{customer_name}`}, {`{business_name}`}, {`{days_since_last_order}`} untuk variabel dinamis
                    </p>
                  </div>

                  {/* File Upload Section */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2 font-montserrat">
                      Lampiran Foto (Opsional):
                    </label>
                    
                    {!selectedFile ? (
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-blue-400 transition-colors">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleFileSelect}
                          className="hidden"
                          id="file-upload"
                        />
                        <label htmlFor="file-upload" className="cursor-pointer">
                          <div className="flex flex-col items-center">
                            <svg className="w-8 h-8 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <p className="text-sm text-gray-600 font-montserrat">
                              Klik untuk memilih foto
                            </p>
                            <p className="text-xs text-gray-500 font-montserrat mt-1">
                              JPG, PNG, GIF (maksimal 5MB)
                            </p>
                          </div>
                        </label>
                      </div>
                    ) : (
                      <div className="border border-gray-300 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <img src={filePreview} alt="Preview" className="w-12 h-12 object-cover rounded" />
                            <div>
                              <p className="text-sm font-medium text-gray-800 font-montserrat">
                                {selectedFile.name}
                              </p>
                              <p className="text-xs text-gray-500 font-montserrat">
                                {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={handleRemoveFile}
                            className="text-red-500 hover:text-red-700 p-1"
                            title="Hapus file"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                        <p className="text-xs text-green-600 font-montserrat">
                          ✅ Foto akan dikirim bersama pesan
                        </p>
                      </div>
                    )}
                  </div>

                  {sendingMessages && (
                    <div className="mb-4">
                      <div className="flex items-center justify-between text-sm text-gray-600 font-montserrat mb-2">
                        <span>Mengirim pesan satu per satu...</span>
                        <span>{Math.round(sendingProgress)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${sendingProgress}%` }}
                        ></div>
                      </div>
                          <p className="text-xs text-gray-500 font-montserrat mt-1">
                            ⏱️ Estimasi waktu: ~{Math.ceil(selectedCustomers.length * 2)} detik (dengan jeda 1.5 detik antar pengiriman)
                            {selectedCustomers.length >= 30 && (
                              <span className="ml-2 text-orange-600 font-medium">
                                (Maksimal 30 customer)
                              </span>
                            )}
                          </p>
                      <p className="text-xs text-blue-600 font-montserrat mt-1">
                        📱 Progress: {Math.round(sendingProgress / 100 * selectedCustomers.length)} dari {selectedCustomers.length} customer
                      </p>
                          {currentProcessingCustomer && (
                            <p className="text-xs text-green-600 font-montserrat mt-1">
                              📤 Sedang mengirim ke: <strong>{currentProcessingCustomer}</strong>
                              {selectedFile && (
                                <span className="ml-2 text-blue-600">
                                  📎 dengan foto
                                </span>
                              )}
                            </p>
                          )}
                    </div>
                  )}

                  <div className="flex gap-3">
                    <AnimatedButton
                      onClick={() => setShowMessageModal(false)}
                      disabled={sendingMessages}
                      className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-montserrat font-medium disabled:opacity-50"
                      variant="gray"
                    >
                      Batal
                    </AnimatedButton>
                    <AnimatedButton
                      onClick={handleSendMessages}
                      disabled={sendingMessages}
                      className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-montserrat font-medium flex items-center justify-center gap-2 disabled:opacity-50"
                      variant="green"
                    >
                      <Send className="w-4 h-4" />
                      {sendingMessages ? 'Mengirim...' : 'Kirim Pesan'}
                    </AnimatedButton>
                  </div>
                </div>
              </div>
            )}

            {/* History Modal */}
            {showHistoryModal && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-2xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h2 className="text-xl font-bold text-gray-800 font-montserrat tracking-wide">
                            History Follow Up Customer
                          </h2>
                          <p className="text-sm text-gray-600 font-montserrat mt-1">
                            {followupHistory.length} dari {historyTotalItems} data follow-up
                          </p>
                        </div>
                        <button
                          onClick={() => setShowHistoryModal(false)}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>

                  {historyLoading ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
                      <p className="mt-4 text-gray-600 font-montserrat">Memuat history...</p>
                    </div>
                  ) : followupHistory.length === 0 ? (
                    <div className="text-center py-8">
                      <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-gray-600 font-montserrat">
                        Belum ada history follow up
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {followupHistory.map((followup) => (
                        <div key={followup.id} className="p-4 rounded-lg border border-gray-200 bg-gray-50">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h3 className="font-semibold text-gray-800 font-montserrat">
                                {followup.customer_name}
                              </h3>
                              <p className="text-sm text-gray-600 font-montserrat">
                                {followup.customer_phone}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-xs text-gray-500 font-montserrat">
                                {formatDate(followup.sent_at)}
                              </p>
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                followup.status === 'sent' 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {followup.status === 'sent' ? 'Terikirim' : 'Gagal'}
                              </span>
                            </div>
                          </div>
                          <div className="bg-white p-3 rounded border">
                            <p className="text-sm text-gray-700 font-montserrat">
                              {followup.message_content}
                            </p>
                          </div>
                          <div className="flex items-center justify-between mt-2 text-xs text-gray-500 font-montserrat">
                            <span>Oleh: {followup.created_by_name}</span>
                            <span>Cabang: {followup.branch_name}</span>
                          </div>
                        </div>
                      ))}
                        </div>
                      )}

                      {/* Load More Button */}
                      {historyCurrentPage < historyTotalPages && (
                        <div className="mt-4 flex justify-center">
                          <AnimatedButton
                            onClick={handleLoadMoreHistory}
                            disabled={historyLoadingMore}
                            className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white px-6 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
                            variant="blue"
                          >
                            {historyLoadingMore ? (
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

                      <div className="flex justify-center mt-6">
                        <AnimatedButton
                          onClick={() => setShowHistoryModal(false)}
                          className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors font-montserrat font-medium"
                          variant="gray"
                        >
                          Tutup
                        </AnimatedButton>
                      </div>
                </div>
              </div>
            )}

          </div>
        </div>
      </main>
    </div>
  );
};

export default FollowUpManagement;
