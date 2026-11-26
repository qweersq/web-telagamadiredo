import { useState, useEffect, useRef } from 'react';
import { Calendar, MessageSquare, Users, Target, Copy, CheckCircle, AlertCircle, BarChart3, Clock } from 'lucide-react';
import HeaderBerandaOwner from '../../components/Com Header/HeaderBerandaOwner';
import AnimatedButton from '../../components/Design/AnimatedButton';
import ConfirmationModal from '../../components/Modal/ConfirmationModal';
import instance from '../../config/api';

const BroadcastPlanning = () => {
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString());
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [selectedCustomers, setSelectedCustomers] = useState([]);
  const [messagePreview, setMessagePreview] = useState('');
  const [broadcastPlan, setBroadcastPlan] = useState({
    name: '',
    scheduled_date: '',
    scheduled_time: '',
    template_id: null,
    customer_count: 0,
    notes: ''
  });
  
  // Loading states
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  
  // Modal states
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showCustomerModal, setShowCustomerModal] = useState(false);

  // Refs for scrolling
  const templateRef = useRef(null);
  const customerRef = useRef(null);
  const planningRef = useRef(null);

  // Update time
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Load initial data
  useEffect(() => {
    loadInitialData();
  }, []);

  // Update message preview when template or selected customers change
  useEffect(() => {
    if (selectedTemplate) {
      generateMessagePreview();
    }
  }, [selectedTemplate, selectedCustomers]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const [templatesRes, customersRes] = await Promise.all([
        instance.get('/followup-templates?category=followup'),
        instance.get('/followup-sequences/ready/customers')
      ]);

      if (templatesRes.data.success) {
        setTemplates(templatesRes.data.data.templates || []);
      }

      if (customersRes.data.success) {
        const customerList = customersRes.data.data.customers || [];
        setCustomers(customerList);
        setFilteredCustomers(customerList);
      }
    } catch (error) {
      console.error('Error loading initial data:', error);
      alert('Gagal memuat data');
    } finally {
      setLoading(false);
    }
  };

  const generateMessagePreview = async () => {
    if (!selectedTemplate || selectedCustomers.length === 0) {
      setMessagePreview('');
      return;
    }

    // Generate preview with sample customer (first selected)
    const sampleCustomer = selectedCustomers[0];
    let content = selectedTemplate.template_content || '';
    
    // Replace variables
    content = content.replace(/\{customer_name\}/g, sampleCustomer.customer_name || 'Customer');
    content = content.replace(/\{business_name\}/g, sampleCustomer.business_name || 'Toko Kami');
    content = content.replace(/\{branch_name\}/g, sampleCustomer.branch_name || 'Cabang Utama');
    content = content.replace(/\{last_order_date\}/g, sampleCustomer.last_order_date ? new Date(sampleCustomer.last_order_date).toLocaleDateString('id-ID') : '-'); 
    content = content.replace(/\{customer_phone\}/g, sampleCustomer.phone || '-');
    
    setMessagePreview(content);
  };

  const handleTemplateSelect = (template) => {
    setSelectedTemplate(template);
    setBroadcastPlan(prev => ({
      ...prev,
      template_id: template.id
    }));
  };

  const handleCustomerToggle = (customer) => {
    setSelectedCustomers(prev => {
      const isSelected = prev.find(cp => cp.customer_id === customer.customer_id);
      if (isSelected) {
        return prev.filter(cp => cp.customer_id !== customer.customer_id);
      } else {
        return [...prev, customer];
      }
    });
  };

  const handleSelectAll = () => {
    if (selectedCustomers.length === filteredCustomers.length) {
      setSelectedCustomers([]);
    } else {
      setSelectedCustomers([...filteredCustomers]);
    }
  };

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopySuccess(true);
      
      // Hide success indicator after 2 seconds
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
      alert('Gagal menyalin ke clipboard');
    }
  };

  const copyCustomerList = () => {
    const numbers = selectedCustomers.map(customer => customer.phone).join('\n');
    copyToClipboard(numbers);
  };

  const saveBroadcastPlan = async () => {
    try {
      setActionLoading(true);
      
      const planData = {
        ...broadcastPlan,
        customer_count: selectedCustomers.length,
        customer_ids: selectedCustomers.map(c => c.customer_id),
        message_content: messagePreview,
        status: 'planned'
      };

      // Save to backend (you'll need to create this endpoint)
      const response = await instance.post('/broadcast-plans', planData);
      
      if (response.data.success) {
        alert('Broadcast plan berhasil disimpan!');
        setShowSaveModal(false);
        resetForm();
      }
    } catch (error) {
      console.error('Error saving broadcast plan:', error);
      alert('Gagal menyimpan broadcast plan');
    } finally {
      setActionLoading(false);
    }  
  };

  const resetForm = () => {
    setSelectedTemplate(null);
    setSelectedCustomers([]);
    setMessagePreview('');
    setBroadcastPlan({
      name: '',
      scheduled_date: '',
      scheduled_time: '',
      template_id: null,
      customer_count: 0,
      notes: ''
    });
  };

  const scrollToSection = (ref) => {
    if (ref.current) {
      ref.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const getBroadcastStatusColor = (count) => {
    if (count === 0) return 'bg-gray-100 text-gray-800 border-gray-200';
    if (count <= 10) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    if (count <= 50) return 'bg-orange-100 text-orange-800 border-orange-200';
    return 'bg-red-100 text-red-800 border-red-200';
  };

  if (loading) {
    return (
      <div className="h-[100dvh] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600 font-montserrat">Memuat data broadcast...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[100dvh] flex flex-col overflow-hidden font-montserrat">
      <HeaderBerandaOwner
        title="Broadcast Planning"
        description="Rencanakan broadcast tanpa auto-send"
        showBackButton={true}
        currentTime={currentTime}
        backPath={'/beranda-marketing'}
      />

      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto px-4 md:px-10 pt-24">
          <div className="max-w-[390px] md:max-w-none mx-auto">

            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-4 sm:mb-6">
              <div className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-4 shadow-sm border border-gray-200">
                <div className="flex flex-col sm:flex-row items-center sm:gap-3 text-center sm:text-left">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-100 rounded-full flex items-center justify-center mb-1 sm:mb-0">
                    <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-lg sm:text-lg font-semibold font-bold text-gray-800 font-montserrat">
                      {templates.length}
                    </p>
                    <p className="text-xs sm:text-sm text-gray-600 font-montserrat">Template</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p<｜tool▁sep｜>-4 shadow-sm border border-gray-200">
                <div className="flex flex-col sm:flex-row items-center sm:gap-3 text-center sm:text-left">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-green-100 rounded-full flex items-center justify-center mb-1 sm:mb-0">
                    <Users className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-lg sm:text-lg font-semibold font-bold text-gray-800 font-montserrat">
                      {customers.length}
                    </p>
                    <p className="text-xs sm:text-sm text-gray-600 font-montserrat">Customer</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-4 shadow-sm border border-gray-200">
                <div className="flex flex-col sm:flex-row items-center sm:gap-3 text-center sm:text-left">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-purple-100 rounded-full flex items-center justify-center mb-1 sm:mb-0">
                    <Target className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-lg sm:text-lg font-semibold font-bold text-gray-800 font-montserrat">
                      {selectedCustomers.length}
                    </p>
                    <p className="text-xs sm:text-sm text-gray-600 font-montserrat">Selected</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-wrap gap-2 sm:gap-3 mb-4 sm:mb-6">
              <AnimatedButton
                onClick={() => scrollToSection(templateRef)}
                className="px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-montserrat text-sm flex items-center gap-2"
              >
                <MessageSquare className="w-4 h-4" />
                Pilih Template
              </AnimatedButton>
              <AnimatedButton
                onClick={() => scrollToSection(customerRef)}
                className="px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-montserrat text-sm flex items-center gap-2"
              >
                <Users className="w-4 h-4" />
                Target Customer
              </AnimatedButton>
              <AnimatedButton
                onClick={() => scrollToSection(planningRef)}
                className="px-3 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors font-montserrat text-sm flex items-center gap-2"
              >
                <Calendar className="w-4 h-4" />
                Rencanakan
              </AnimatedButton>
            </div>

            {/* Template Selection */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 mb-4 sm:mb-6" ref={templateRef}>
              <div className="p-4 sm:p-6 border-b border-gray-200">
                <h2 className="text-base sm:text-lg font-bold text-gray-800 font-montserrat tracking-wide">
                  Pilih Template ({templates.length})
                </h2>
              </div>
              <div className="p-4 sm:p-6">
                {templates.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {templates.map((template) => (
                      <div
                        key={template.id}
                          onClick={() => handleTemplateSelect(template)}
                        className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                          selectedTemplate?.id === template.id
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        <h3 className="font-medium text-gray-800 text-sm mb-1">{template.title}</h3>
                        <p className="text-xs text-gray-600 line-clamp-2">{template.description}</p>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs text-gray-500">
                            {template.variables?.length || 0} vars
                          </span>
                          <span className="text-xs text-gray-500">
                            {template.template_content?.length || 0} chars
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-600 font-montserrat mb-3">Belum ada template tersedia</p>
                    <AnimatedButton
                      onClick={() => window.open('/followup/templates/create', '_blank')}
                      className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-montserrat text-sm"
                    >
                      Buat Template
                    </AnimatedButton>
                  </div>
                )}
              </div>
            </div>

            {/* Customer Selection */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 mb-4 sm:mb-6" ref={customerRef}>
              <div className="p-4 sm:p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-base sm:text-lg font-bold text-gray-800 font-montserrat tracking-wide">
                    Target Customer ({selectedCustomers.length}/{customers.length})
                  </h2>
                  <AnimatedButton
                    onClick={handleSelectAll}
                    className="px-3 py-1 bg-blue-500 text-white rounded text-xs font-montserrat"
                  >
                    {selectedCustomers.length === customers.length ? 'Unselect All' : 'Select All'}
                  </AnimatedButton>
                </div>
              </div>
              <div className="p-4 sm:p-6">
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {customers.map((customer) => {
                    const isSelected = selectedCustomers.find(cp => cp.customer_id === customer.customer_id);
                    return (
                      <div
                        key={customer.customer_id}
                        onClick={() => handleCustomerToggle(customer)}
                        className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                          isSelected
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-gray-800 text-sm">{customer.customer_name}</h3>
                            <p className="text-xs text-gray-600">{customer.phone}</p>
                          </div>
                          <div className="ml-3">
                            {isSelected && (
                              <CheckCircle className="w-4 h-4 text-blue-500" />
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Broadcast Planning */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 mb-4 sm:mb-6" ref={planningRef}>
              <div className="p-4 sm:p-6 border-b border-gray-200">
                <h2 className="text-base sm:text-lg font-bold text-gray-800 font-montserrat tracking-wide">
                  Rencana Broadcast
                </h2>
              </div>
              <div className="p-4 sm:p-6 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Nama Campaign</label>
                    <input
                      type="text"
                      value={broadcastPlan.name}
                      onChange={(e) => setBroadcastPlan(prev => ({...prev, name: e.target.value}))}
                      placeholder="Misal: Promo Ramadan..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Tanggal</label>
                    <input
                      type="date"
                      value={broadcastPlan.scheduled_date}
                      onChange={(e) => setBroadcastPlan(prev => ({...prev, scheduled_date: e.target.value}))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Waktu</label>
                  <input
                    type="time"
                    value={broadcastPlan.scheduled_time}
                    onChange={(e) => setBroadcastPlan(prev => ({...prev, scheduled_time: e.target.value}))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {selectedTemplate && selectedCustomers.length > 0 && (
                  <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                    <h3 className="font-medium text-gray-800 mb-2">Preview Pesan:</h3>
                    <div className="text-sm text-gray-600 bg-white p-3 rounded border mb-3 max-h-32 overflow-y-auto">
                      {messagePreview}
                    </div>
                    
                    <div className="flex gap-2">
                      <AnimatedButton
                        onClick={() => copyToClipboard(messagePreview)}
                        className="flex-1 px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors font-montserrat text-xs flex items-center justify-center gap-1"
                      >
                        <Copy className="w-3 h-3" />
                        Copy Pesan
                      </AnimatedButton>
                      
                      <AnimatedButton
                        onClick={copyCustomerList}
                        className="px-3 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors font-montserrat text-xs flex items-center gap-1"
                      >
                        <Users className="w-3 h-3" />
                        Copy {selectedCustomers.length} Numbers
                      </AnimatedButton>
                    </div>

                    {copySuccess && (
                      <div className="flex items-center text-green-600 text-xs mt-2">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Berhasil disalin!
                      </div>
                    )}
                  </div>
                )}

                <div className="flex gap-3">
                  <AnimatedButton
                    onClick={() => setShowSaveModal(true)}
                    disabled={!selectedTemplate || selectedCustomers.length === 0 || !broadcastPlan.name}
                    className="flex-1 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:bg-gray-300 transition-colors font-montserrat text-sm flex items-center justify-center gap-2"
                  >
                    <Calendar className="w-4 h-4" />
                    Simpan Rencana
                  </AnimatedButton>
                  
                  <AnimatedButton
                    onClick={resetForm}
                    className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors font-montserrat text-sm"
                  >
                    Reset
                  </AnimatedButton>
                </div>
              </div>
            </div>

            {/* Warning Alert */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start">
                <AlertCircle className="w-5 h-5 text-yellow-600 mr-3 mt-0.5" />
                <div>
                  <h3 className="font-medium text-yellow-800">Manual Broadcast - Aman!</h3>
                  <p className="text-sm text-yellow-700 mt-1">
                    Sistem ini hanya untuk planning dan copy pesan. Tidak ada auto-send yang berbahaya. 
                    Anda tetap perlu kirim manual di WhatsApp untuk setiap customer.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Save Confirmation Modal */}
      <ConfirmationModal
        isOpen={showSaveModal}
        onClose={() => setShowSaveModal(false)}
        onConfirm={saveBroadcastPlan}
        title="Simpan Rencana Broadcast?"
        message={`Anda akan menyimpan rencana campaign "${broadcastPlan.name}" dengan ${selectedCustomers.length} target customer. Rencana ini akan disimpan tanpa auto-send.`}
        confirmText="Simpan"
        cancelText="Batal"
        isLoading={actionLoading}
      />
    </div>
  );
};

export default BroadcastPlanning;
