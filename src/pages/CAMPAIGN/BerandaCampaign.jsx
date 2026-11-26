import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import instance from "../../config/api";
import { getUserProfile } from "../../utils/userProfileHelper";
import HeaderBerandaOwner from "../../components/Com Header/HeaderBerandaOwner";
import AnimatedButton from "../../components/Design/AnimatedButton";
import ConfirmationModal from "../../components/Modal/ConfirmationModal";
import InfoModal from "../../components/Modal/InfoModal";
import CampaignTemplateModal from "./components/CampaignTemplateModal";
import CampaignWaModal from "./components/CampaignWaModal";
import HelpTooltip from "../../components/WhatsAppTemplate/HelpTooltip";

const BerandaCampaign = () => {
  const navigate = useNavigate();
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString());
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Campaign States
  const [campaign, setCampaign] = useState(null);
  const [templates, setTemplates] = useState([]);
  const [customerCount, setCustomerCount] = useState(0);
  const [selectedTarget, setSelectedTarget] = useState('follow_up_30');
  const [progress, setProgress] = useState({
    total: 0,
    sent: 0,
    failed: 0,
    pending: 0,
    progress: 0,
    estimatedHours: 0
  });
  
  // Modal States
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showStartModal, setShowStartModal] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [showConfirmStartModal, setShowConfirmStartModal] = useState(false);
  const [showWaModal, setShowWaModal] = useState(false);
  
  // WA States
  const [waConnected, setWaConnected] = useState(false);
  const [waStatus, setWaStatus] = useState(null);

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Check WA status
  const checkWaStatus = async () => {
    try {
      const response = await instance.get('/campaigns/wa/status');
      if (response.data.success) {
        const status = response.data.data;
        setWaStatus(status);
        setWaConnected(status.connected && status.status === 'READY');
      }
    } catch (error) {
      console.error('❌ Error checking WA status:', error);
      setWaConnected(false);
      setWaStatus({ connected: false, status: 'DISCONNECTED' });
    }
  };

  // Load user data
  useEffect(() => {
    let isMounted = true;
    
    const loadUserData = async () => {
      try {
        const profile = await getUserProfile();
        if (isMounted && profile) {
          const userData = {
            id: profile.user?.id,
            name: profile.user?.name,
            email: profile.user?.email,
            role: profile.user?.role,
            branch_id: profile.branch?.id,
            branch_name: profile.branch?.name,
            tenant_id: profile.tenant?.id,
            tenant_name: profile.tenant?.business_name
          };
          setUserData(userData);
          console.log('✅ BerandaCampaign - User data loaded:', userData);
        }
      } catch (error) {
        console.error('❌ BerandaCampaign - Error loading user data:', error);
      }
    };
    
    loadUserData();
    
    return () => {
      isMounted = false;
    };
  }, []);

  // Load campaign data
  useEffect(() => {
    let isMounted = true;
    
    if (userData) {
      loadCampaignData(isMounted);
      loadTemplates(isMounted);
      loadCustomerCount(selectedTarget, isMounted);
      checkWaStatus();
    }
    
    return () => {
      isMounted = false;
    };
  }, [userData]);

  const loadCampaignData = async (isMounted = true) => {
    try {
      setLoading(true);
      
      // Load campaigns (should be max 1)
      try {
        const campaignsResponse = await instance.get('/campaigns?limit=1');
        if (isMounted && campaignsResponse.data.success) {
          const campaigns = campaignsResponse.data.data.campaigns || [];
          if (campaigns.length > 0) {
            setCampaign(campaigns[0]); // Get the first (and only) campaign
            // Load progress for existing campaign
            loadCampaignProgress(campaigns[0].id, isMounted);
          } else {
            // No campaign exists, create default one
            await createDefaultCampaign();
          }
        }
      } catch (campaignError) {
        console.warn('⚠️ Campaigns API not available:', campaignError.message);
        setCampaign(null);
      }

    } catch (error) {
      console.error('❌ Error loading campaign data:', error);
    } finally {
      if (isMounted) {
        setLoading(false);
      }
    }
  };

  const createDefaultCampaign = async () => {
    try {
      const response = await instance.post('/campaigns', {
        name: "Broadcast Campaign",
        message_content: "Halo! Selamat bergabung dengan layanan kami. Terima kasih telah mempercayai layanan kami. Kami siap melayani Anda dengan sepenuh hati!",
        target_audience: "all"
      });
      
      if (response.data.success) {
        setCampaign(response.data.data);
        // Load progress for new campaign
        loadCampaignProgress(response.data.data.id, true);
      }
    } catch (error) {
      console.error('❌ Error creating default campaign:', error);
    }
  };

  const loadTemplates = async (isMounted = true) => {
    try {
      const response = await instance.get('/whatsapp-templates?category=campaign&is_active=true');
      if (isMounted && response.data.success) {
        setTemplates(response.data.data.templates || []);
      }
    } catch (error) {
      console.warn('⚠️ Templates API not available:', error.message);
      if (isMounted) {
        setTemplates([]);
      }
    }
  };

  const loadCustomerCount = async (targetAudience = 'follow_up_30', isMounted = true) => {
    try {
      const response = await instance.get(`/campaigns/customer-count-preview?target_audience=${targetAudience}&follow_up_days=${targetAudience === 'follow_up_15' ? 15 : targetAudience === 'follow_up_30' ? 30 : 60}`);
      if (isMounted && response.data.success) {
        setCustomerCount(response.data.data.customer_count || 0);
      }
    } catch (error) {
      console.warn('⚠️ Customer count API not available:', error.message);
      if (isMounted) {
        setCustomerCount(0);
      }
    }
  };

  const handleTargetChange = (target) => {
    setSelectedTarget(target);
    loadCustomerCount(target);
  };

  const loadCampaignProgress = async (campaignId, isMounted = true) => {
    try {
      const response = await instance.get(`/campaigns/${campaignId}/progress`);
      if (isMounted && response.data.success) {
        setProgress(response.data.data.progress);
      }
    } catch (error) {
      console.warn('⚠️ Campaign progress API not available:', error.message);
      if (isMounted) {
        setProgress({
          total: 0,
          sent: 0,
          failed: 0,
          pending: 0,
          progress: 0,
          estimatedHours: 0
        });
      }
    }
  };

  const handleLogoutConfirm = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const handleCampaignAction = async (action) => {
    if (!campaign) return;
    
    try {
      let response;
      switch (action) {
        case 'start':
          response = await instance.post(`/campaigns/${campaign.id}/start`);
          break;
        case 'pause':
          response = await instance.post(`/campaigns/${campaign.id}/pause`);
          break;
        case 'resume':
          response = await instance.post(`/campaigns/${campaign.id}/resume`);
          break;
        default:
          return;
      }
      
      if (response.data.success) {
        loadCampaignData(true); // Refresh data
        // Refresh progress after action
        loadCampaignProgress(campaign.id, true);
        alert(`✅ Campaign ${action}ed successfully!`);
      }
    } catch (error) {
      console.error(`❌ Error ${action}ing campaign:`, error);
      alert(`❌ Failed to ${action} campaign: ${error.response?.data?.message || error.message}`);
    }
  };

  const handleSelectTemplate = async (template) => {
    if (!campaign) return;
    
    try {
      // Update campaign with selected template
      const response = await instance.put(`/campaigns/${campaign.id}`, {
        template_id: template.id,
        message_content: template.template_content
      });
      
      if (response.data.success) {
        setCampaign(prev => ({
          ...prev,
          template_id: template.id,
          message_content: template.template_content
        }));
        setShowTemplateModal(false);
        alert('✅ Template berhasil dipilih!');
      }
    } catch (error) {
      console.error('❌ Error selecting template:', error);
      alert(`❌ Error: ${error.response?.data?.message || error.message}`);
    }
  };

  const getStatusInfo = (status) => {
    switch (status) {
      case 'running':
        return { text: '🚀 Running', color: 'bg-green-100 text-green-800' };
      case 'completed':
        return { text: '✅ Completed', color: 'bg-blue-100 text-blue-800' };
      case 'paused':
        return { text: '⏸️ Paused', color: 'bg-yellow-100 text-yellow-800' };
      case 'error':
        return { text: '❌ Error', color: 'bg-red-100 text-red-800' };
      default:
        return { text: '📝 Draft', color: 'bg-gray-100 text-gray-800' };
    }
  };

  if (loading) {
    return (
      <div className="h-[100dvh] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600 font-montserrat">Memuat campaign...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[100dvh] flex flex-col overflow-hidden font-montserrat">
      <HeaderBerandaOwner
        title="CAMPAIGN DASHBOARD"
        description="Simple Campaign Broadcast Management"
        showBackButton={false}
        hideLogout={false}
        currentTime={currentTime}
        onLogout={() => setShowLogoutModal(true)}
      />

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto px-4 md:px-10 pt-10 pb-6">
          <div className="max-w-[390px] md:max-w-none mx-auto mt-[50px]">


            {/* Campaign Detail Card */}
            {campaign ? (
              <div className="mb-6 rounded-3xl p-6 outline outline-2 outline-[#EEF1F7] bg-white">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold font-montserrat text-gray-800">
                        {campaign.name}
                      </h2>
                      <div className="flex items-center gap-2 mt-1">
                        {campaign.status !== 'draft' && (
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusInfo(campaign.status).color}`}>
                            {getStatusInfo(campaign.status).text}
                          </span>
                        )}
                        {campaign.is_default && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                            Default
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Campaign Info */}
                <div className="space-y-4 mb-6">
                  {/* Dormant Customer Selection */}
                  <div className="bg-gray-50 rounded-2xl p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <h3 className="font-semibold text-gray-700 text-sm font-montserrat">Pilih Target Customer</h3>
                      <HelpTooltip
                        title="Penjelasan Target Customer"
                        content="Dormant customer adalah customer yang sudah lama tidak melakukan order. Pilih berdasarkan berapa hari customer tidak order:

• 15 Hari Dormant: Customer yang tidak order selama 15 hari terakhir
• 30 Hari Dormant: Customer yang tidak order selama 30 hari terakhir  
• 60 Hari Dormant: Customer yang tidak order selama 60 hari terakhir
• Semua Customer: Semua customer tanpa filter

Semakin lama dormant, semakin tinggi prioritas untuk di-follow up."
                        size="md"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => handleTargetChange('follow_up_15')}
                        className={`p-3 rounded-xl text-sm font-montserrat transition-colors ${
                          selectedTarget === 'follow_up_15'
                            ? 'bg-blue-500 text-white'
                            : 'bg-white text-gray-700 hover:bg-blue-50'
                        }`}
                      >
                        15 Hari Dormant
                      </button>
                      <button
                        onClick={() => handleTargetChange('follow_up_30')}
                        className={`p-3 rounded-xl text-sm font-montserrat transition-colors ${
                          selectedTarget === 'follow_up_30'
                            ? 'bg-blue-500 text-white'
                            : 'bg-white text-gray-700 hover:bg-blue-50'
                        }`}
                      >
                        30 Hari Dormant
                      </button>
                      <button
                        onClick={() => handleTargetChange('follow_up_60')}
                        className={`p-3 rounded-xl text-sm font-montserrat transition-colors ${
                          selectedTarget === 'follow_up_60'
                            ? 'bg-blue-500 text-white'
                            : 'bg-white text-gray-700 hover:bg-blue-50'
                        }`}
                      >
                        60 Hari Dormant
                      </button>
                      <button
                        onClick={() => handleTargetChange('all')}
                        className={`p-3 rounded-xl text-sm font-montserrat transition-colors ${
                          selectedTarget === 'all'
                            ? 'bg-blue-500 text-white'
                            : 'bg-white text-gray-700 hover:bg-blue-50'
                        }`}
                      >
                        Semua Customer
                      </button>
                    </div>
                  </div>

                  {/* Total Customers */}
                  <div className="bg-blue-50 rounded-2xl p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-blue-800 text-sm font-montserrat">Total Customers</h3>
                          <HelpTooltip
                            title="Penjelasan Total Customers"
                            content="Jumlah customer yang akan menerima campaign berdasarkan pilihan target di atas. Angka ini akan berubah sesuai dengan pilihan dormant customer yang Anda pilih."
                            size="sm"
                          />
                        </div>
                        <p className="text-2xl font-bold text-blue-900 font-montserrat">{customerCount}</p>
                        <p className="text-xs text-blue-600 font-montserrat capitalize">
                          Target: {selectedTarget === 'follow_up_15' ? '15 hari dormant' : 
                                  selectedTarget === 'follow_up_30' ? '30 hari dormant' :
                                  selectedTarget === 'follow_up_60' ? '60 hari dormant' : 'semua customer'}
                        </p>
                      </div>
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  {/* Message Template Selection */}
                  <div className="bg-gray-50 rounded-2xl p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-700 text-sm font-montserrat">Message Template</h3>
                        <HelpTooltip
                          title="Penjelasan Message Template"
                          content="Template pesan yang akan dikirim ke customer. Anda bisa memilih dari template yang sudah dibuat atau membuat template baru.

Template akan menggunakan variabel seperti {{customer_name}} dan {{business_name}} yang akan diganti otomatis dengan data customer yang sebenarnya."
                          size="sm"
                        />
                      </div>
                      <button
                        onClick={() => setShowTemplateModal(true)}
                        className="text-blue-500 text-xs font-montserrat hover:text-blue-600"
                      >
                        Pilih Template
                      </button>
                    </div>
                    <div className="bg-white rounded-xl p-3 border">
                      <p className="text-gray-600 font-montserrat text-sm leading-relaxed">
                        {campaign.message_content}
                      </p>
                    </div>
                    {templates.length > 0 && (
                      <p className="text-xs text-gray-500 font-montserrat mt-2">
                        {templates.length} template tersedia
                      </p>
                    )}
                  </div>

                  {/* Progress Bar - Only show when campaign is running, paused, or completed */}
                  {(campaign.status === 'running' || campaign.status === 'paused' || campaign.status === 'completed') && (
                    <div className="bg-gray-50 rounded-2xl p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold text-gray-700 text-sm font-montserrat">Progress</h3>
                        <span className="text-sm font-bold text-gray-800 font-montserrat">{progress.progress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
                        <div 
                          className="bg-gradient-to-r from-blue-500 to-green-500 h-3 rounded-full transition-all duration-500"
                          style={{ width: `${progress.progress}%` }}
                        ></div>
                      </div>
                      {progress.estimatedHours > 0 && campaign.status === 'running' && (
                        <p className="text-xs text-gray-500 font-montserrat">
                          Estimasi selesai: {progress.estimatedHours} jam
                        </p>
                      )}
                    </div>
                  )}

                  {/* Campaign Stats - Only show when campaign is running, paused, or completed */}
                  {(campaign.status === 'running' || campaign.status === 'paused' || campaign.status === 'completed') && (
                    <div className="grid grid-cols-3 gap-3">
                      <div className="bg-green-50 rounded-xl p-3 text-center">
                        <p className="text-xs text-green-600 font-montserrat font-medium">Sent</p>
                        <p className="text-lg font-bold text-green-800 font-montserrat">{progress.sent}</p>
                      </div>
                      <div className="bg-red-50 rounded-xl p-3 text-center">
                        <p className="text-xs text-red-600 font-montserrat font-medium">Failed</p>
                        <p className="text-lg font-bold text-red-800 font-montserrat">{progress.failed}</p>
                      </div>
                      <div className="bg-blue-50 rounded-xl p-3 text-center">
                        <p className="text-xs text-blue-600 font-montserrat font-medium">Success Rate</p>
                        <p className="text-lg font-bold text-blue-800 font-montserrat">
                          {progress.sent > 0 ? Math.round(((progress.sent - progress.failed) / progress.sent) * 100) : 0}%
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* WhatsApp Connection */}
                <div className="mb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-700">WhatsApp Campaign</span>
                      <HelpTooltip content="Koneksi WhatsApp khusus untuk campaign broadcast. Harus terhubung sebelum memulai campaign." />
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${
                        waConnected ? 'bg-green-500' : 
                        waStatus?.status === 'PENDING' ? 'bg-yellow-500' : 
                        'bg-red-500'
                      }`}></div>
                      <span className="text-sm text-gray-600">
                        {waConnected ? 'Terhubung' : 
                         waStatus?.status === 'PENDING' ? 'Menunggu QR Scan' :
                         'Belum Terhubung'}
                      </span>
                    </div>
                  </div>
                  
                  <AnimatedButton
                    onClick={() => setShowWaModal(true)}
                    className={`w-full mt-2 px-4 py-2 rounded-lg font-montserrat font-medium transition-colors ${
                      waConnected 
                        ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                        : 'bg-red-100 text-red-700 hover:bg-red-200'
                    }`}
                  >
                    {waConnected ? '📱 Kelola WhatsApp' : '📱 Hubungkan WhatsApp'}
                  </AnimatedButton>
                </div>

                {/* Campaign Actions */}
                <div className="flex gap-3">
                  {campaign.status === 'draft' && (
                    <AnimatedButton
                      onClick={() => setShowConfirmStartModal(true)}
                      disabled={!waConnected}
                      className={`flex-1 px-4 py-3 rounded-xl font-montserrat font-semibold transition-colors ${
                        waConnected
                          ? 'bg-green-500 text-white hover:bg-green-600'
                          : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      🚀 Start Campaign
                    </AnimatedButton>
                  )}
                  
                  {campaign.status === 'running' && (
                    <AnimatedButton
                      onClick={() => handleCampaignAction('pause')}
                      className="flex-1 px-4 py-3 bg-yellow-500 text-white rounded-xl font-montserrat font-semibold hover:bg-yellow-600 transition-colors"
                    >
                      ⏸️ Pause Campaign
                    </AnimatedButton>
                  )}
                  
                  {campaign.status === 'paused' && (
                    <AnimatedButton
                      onClick={() => handleCampaignAction('resume')}
                      className="flex-1 px-4 py-3 bg-green-500 text-white rounded-xl font-montserrat font-semibold hover:bg-green-600 transition-colors"
                    >
                      ▶️ Resume Campaign
                    </AnimatedButton>
                  )}

                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500 font-montserrat">
                <div className="mb-4">
                  <svg className="w-12 h-12 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <p className="mb-2">Tidak ada campaign</p>
                <p className="text-sm text-gray-400 mb-4">
                  Campaign akan dibuat otomatis saat pertama kali
                </p>
                <AnimatedButton
                  onClick={createDefaultCampaign}
                  className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  Buat Campaign
                </AnimatedButton>
              </div>
            )}

          </div>
        </div>
      </main>

      {/* Logout Confirmation Modal */}
      <ConfirmationModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={handleLogoutConfirm}
        title="Logout Confirmation"
        message="Are you sure you want to logout?"
      />

      {/* Template Selection Modal */}
      <CampaignTemplateModal
        isOpen={showTemplateModal}
        onClose={() => setShowTemplateModal(false)}
        onSelectTemplate={handleSelectTemplate}
        selectedTemplateId={campaign?.template_id}
      />

      {/* Start Campaign Confirmation Modal */}
      <ConfirmationModal
        isOpen={showConfirmStartModal}
        onClose={() => setShowConfirmStartModal(false)}
        onConfirm={() => {
          setShowConfirmStartModal(false);
          handleCampaignAction('start');
        }}
        title="Konfirmasi Start Campaign"
        message={`Apakah Anda yakin ingin memulai campaign ke ${customerCount} customer? 

Campaign akan berjalan otomatis dan tidak bisa diubah hingga selesai. Campaign baru bisa dimulai lagi setelah 14 hari kemudian.`}
      />

      {/* WhatsApp Campaign Modal */}
      <CampaignWaModal
        isOpen={showWaModal}
        onClose={() => setShowWaModal(false)}
        onWaConnected={(connected) => {
          setWaConnected(connected);
          if (connected) {
            checkWaStatus();
          }
        }}
      />

    </div>
  );
};

export default BerandaCampaign;
