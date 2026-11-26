import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import instance from "../../config/api";
import { getUserProfile } from "../../utils/userProfileHelper";
import HeaderBerandaOwner from "../../components/Com Header/HeaderBerandaOwner";
import AnimatedButton from "../../components/Design/AnimatedButton";
import ConfirmationModal from "../../components/Modal/ConfirmationModal";
import InfoModal from "../../components/Modal/InfoModal";
import QuickPromoModal from "./QuickPromoModal";
import TutorialModal from "./TutorialModal";

const BerandaMarketing = () => {
  const navigate = useNavigate();
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString());
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Follow-up States
  const [followupStats, setFollowupStats] = useState({
    total_customers_in_sequence: 0,
    total_messages_sent: 0,
    total_responses: 0,
    response_rate: "0.00",
    conversion_rate: "0.00"
  });
  const [activeSequences, setActiveSequences] = useState([]);
  const [readyCustomers, setReadyCustomers] = useState([]);
  const [monthlyReport, setMonthlyReport] = useState(null);
  
  // Modal States
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [showQuickPromoModal, setShowQuickPromoModal] = useState(false);
  const [showTutorialModal, setShowTutorialModal] = useState(false);

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Load user data
  useEffect(() => {
    const loadUserData = async () => {
      try {
        const profile = await getUserProfile();
        if (profile) {
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
          console.log('✅ BerandaMarketing - User data loaded:', userData);
        }
      } catch (error) {
        console.error('❌ BerandaMarketing - Error loading user data:', error);
      }
    };
    
    loadUserData();
  }, []);

  // Load follow-up data
  useEffect(() => {
    if (userData) {
      loadFollowupData();
    }
  }, [userData]);

  const loadFollowupData = async () => {
    try {
      setLoading(true);
      
      // Load statistics
      const statsResponse = await instance.get('/followup-sequences/analytics/statistics');
      if (statsResponse.data.success) {
        setFollowupStats(statsResponse.data.data);
      }

      // Load active sequences
      const sequencesResponse = await instance.get('/followup-sequences?limit=5');
      if (sequencesResponse.data.success) {
        setActiveSequences(sequencesResponse.data.data.sequences || []);
      }

      // Load ready customers
      const readyResponse = await instance.get('/followup-sequences/ready/customers');
      if (readyResponse.data.success) {
        setReadyCustomers(readyResponse.data.data.customers || []);
      }

      // Load monthly report
      const reportResponse = await instance.get('/followup-sequences/reports/monthly');
      if (reportResponse.data.success) {
        setMonthlyReport(reportResponse.data.data);
      }

    } catch (error) {
      console.error('❌ Error loading follow-up data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogoutConfirm = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const handleExecuteFollowup = async () => {
    try {
      const response = await instance.post('/followup-sequences/execute/followup', {
        limit: 50
      });
      
      if (response.data.success) {
        const { summary } = response.data.data;
        alert(`✅ Follow-up berhasil dijalankan!\n📤 Terkirim: ${summary.success}\n❌ Gagal: ${summary.failed}`);
        loadFollowupData(); // Refresh data
      }
    } catch (error) {
      console.error('❌ Error executing follow-up:', error);
      alert('❌ Gagal menjalankan follow-up: ' + (error.response?.data?.message || error.message));
    }
  };

  if (loading) {
    return (
      <div className="h-[100dvh] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600 font-montserrat">Memuat data follow-up...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[100dvh] flex flex-col overflow-hidden font-montserrat">
      <HeaderBerandaOwner
        title="MARKETING DASHBOARD"
        description="Follow-up & Customer Engagement"
        showBackButton={false}
        hideLogout={false}
        currentTime={currentTime}
        onLogout={() => setShowLogoutModal(true)}
        addButton={
          <AnimatedButton
            onClick={() => setShowTutorialModal(true)}
            className="px-4 py-2 rounded-lg text-sm bg-purple-500 hover:bg-purple-600 text-white flex items-center gap-2"
            variant="purple"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Panduan
          </AnimatedButton>
        }
      />

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto px-4 md:px-10 pt-10 pb-6">
          <div className="max-w-[390px] md:max-w-none mx-auto mt-[50px]">

            {/* Quick Actions Menu */}
            <div className="mb-6">
              <div className="grid grid-cols-2 gap-3 mb-3">
                <AnimatedButton
                  onClick={() => navigate('/followup/sequences')}
                  className="flex flex-col items-center justify-center p-4 bg-white rounded-2xl shadow-sm hover:shadow-md transition-all border border-gray-200 font-montserrat"
                >
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mb-2">
                    <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <span className="text-xs font-medium text-gray-700 font-montserrat">Sequences</span>
                </AnimatedButton>

                <AnimatedButton
                  onClick={() => navigate('/followup/templates')}
                  className="flex flex-col items-center justify-center p-4 bg-white rounded-2xl shadow-sm hover:shadow-md transition-all border border-gray-200 font-montserrat"
                >
                  <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center mb-2">
                    <svg className="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                    </svg>
                  </div>
                  <span className="text-xs font-medium text-gray-700 font-montserrat">Template WA</span>
                </AnimatedButton>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <AnimatedButton
                  onClick={() => navigate('/followup/manual')}
                  className="flex flex-col items-center justify-center p-4 bg-white rounded-2xl shadow-sm hover:shadow-md transition-all border border-gray-200 font-montserrat"
                >
                  <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center mb-2">
                    <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <span className="text-xs font-medium text-gray-700 font-montserrat">Manual FU</span>
                </AnimatedButton>

                <AnimatedButton
                  onClick={() => navigate('/followup/broadcast-planning')}
                  className="flex flex-col items-center justify-center p-4 bg-white rounded-2xl shadow-sm hover:shadow-md transition-all border border-gray-200 font-montserrat"
                >
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mb-2">
                    <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                    </svg>
                  </div>
                  <span className="text-xs font-medium text-gray-700 font-montserrat">Broadcast</span>
                </AnimatedButton>
              </div>

              <div className="grid grid-cols-1 gap-3">
                <AnimatedButton
                  onClick={() => navigate('/followup/reports')}
                  className="flex flex-col items-center justify-center p-4 bg-white rounded-2xl shadow-sm hover:shadow-md transition-all border border-gray-200 font-montserrat"
                >
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mb-2">
                    <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <span className="text-xs font-medium text-gray-700 font-montserrat">Reports</span>
                </AnimatedButton>
              </div>

              {/* Execute Follow-up Button */}
              <div className="mt-4">
                <AnimatedButton
                  variant="blue"
                  onClick={handleExecuteFollowup}
                  disabled={readyCustomers.length === 0}
                  className="w-full h-[45px] flex items-center justify-center rounded-xl font-montserrat font-semibold transition-all text-white shadow-lg hover:shadow-xl transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                    <span>Jalankan Follow-Up ({readyCustomers.length})</span>
                  </div>
                </AnimatedButton>
              </div>
            </div>

            {/* Follow-up Statistics Card */}
            <div className="mb-6 rounded-3xl p-4 outline outline-2 outline-[#EEF1F7] bg-white">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-semibold font-montserrat">Statistik Follow-Up</h2>
                  <button
                    onClick={() => setShowInfoModal(true)}
                    className="group relative"
                    title="Informasi tentang statistik follow-up"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 text-gray-400 hover:text-blue-500 transition-colors"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 16h-1v-4h-1m1-4h.01M12 20a8 8 0 100-16 8 8 0 000 16z"
                      />
                    </svg>
                  </button>
                </div>
                <AnimatedButton
                  onClick={() => navigate('/followup/analytics')}
                  className="h-[35px] px-4 py-2 flex items-center justify-center rounded-xl font-montserrat font-semibold transition-all bg-gradient-to-r from-[#5096FC] to-[#7BD1FD] text-white hover:from-[#4088EB] hover:to-[#6BC1ED] shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
                >
                  Detail Analytics
                </AnimatedButton>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-blue-50 rounded-2xl p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-blue-800 text-sm font-montserrat">
                        Customer Aktif
                      </h3>
                      <p className="text-lg font-semibold font-bold text-blue-600 font-montserrat">
                        {followupStats.total_customers_in_sequence}
                      </p>
                    </div>
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                      </svg>
                    </div>
                  </div>
                </div>

                <div className="bg-green-50 rounded-2xl p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-green-800 text-sm font-montserrat">
                        Pesan Terkirim
                      </h3>
                      <p className="text-lg font-semibold font-bold text-green-600 font-montserrat">
                        {followupStats.total_messages_sent}
                      </p>
                    </div>
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                    </div>
                  </div>
                </div>

                <div className="bg-purple-50 rounded-2xl p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-purple-800 text-sm font-montserrat">
                        Response Rate
                      </h3>
                      <p className="text-lg font-semibold font-bold text-purple-600 font-montserrat">
                        {followupStats.response_rate}%
                      </p>
                    </div>
                    <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                  </div>
                </div>

                <div className="bg-orange-50 rounded-2xl p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-orange-800 text-sm font-montserrat">
                        Conversion Rate
                      </h3>
                      <p className="text-lg font-semibold font-bold text-orange-600 font-montserrat">
                        {followupStats.conversion_rate}%
                      </p>
                    </div>
                    <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Active Sequences */}
            <div className="mb-6 rounded-3xl p-4 outline outline-2 outline-[#EEF1F7] bg-white">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold font-montserrat">Sequence Aktif</h2>
                <AnimatedButton
                  onClick={() => navigate('/followup/sequences/create')}
                  className="h-[35px] px-4 py-2 flex items-center justify-center rounded-xl font-montserrat font-semibold transition-all bg-green-500 text-white hover:bg-green-600 shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
                >
                  + Buat Baru
                </AnimatedButton>
              </div>

              <div className="space-y-3">
                {activeSequences.length > 0 ? (
                  activeSequences.map((sequence, index) => (
                    <div
                      key={sequence.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-colors cursor-pointer"
                      onClick={() => navigate(`/followup/sequences/${sequence.id}`)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-blue-600 font-bold text-sm">
                            {index + 1}
                          </span>
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-800 text-sm font-montserrat">
                            {sequence.name}
                          </h3>
                          <p className="text-xs text-gray-500 font-montserrat">
                            {sequence.templates?.length || 0} template • {sequence.is_active ? 'Aktif' : 'Nonaktif'}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          sequence.is_active 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {sequence.is_active ? '✅ Aktif' : '⏸️ Nonaktif'}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500 font-montserrat">
                    <p>Belum ada sequence yang dibuat</p>
                    <AnimatedButton
                      onClick={() => navigate('/followup/sequences/create')}
                      className="mt-4 px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                    >
                      Buat Sequence Pertama
                    </AnimatedButton>
                  </div>
                )}
              </div>
            </div>

            {/* Ready for Follow-up */}
            {readyCustomers.length > 0 && (
              <div className="mb-6 rounded-3xl p-4 outline outline-2 outline-[#EEF1F7] bg-white">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold font-montserrat">Siap Follow-Up</h2>
                  <span className="text-sm text-gray-600 font-montserrat">
                    {readyCustomers.length} customer
                  </span>
                </div>

                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {readyCustomers.slice(0, 5).map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-2 bg-yellow-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-yellow-100 rounded-full flex items-center justify-center">
                          <svg className="w-3 h-3 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-800 font-montserrat">
                            {item.customer?.name}
                          </p>
                          <p className="text-xs text-gray-500 font-montserrat">
                            Step {item.current_step} • {item.sequence?.name}
                          </p>
                        </div>
                      </div>
                      <div className="text-xs text-yellow-600 font-montserrat">
                        Siap kirim
                      </div>
                    </div>
                  ))}
                </div>

                {readyCustomers.length > 5 && (
                  <div className="mt-3 text-center">
                    <button 
                      onClick={() => navigate('/followup/ready-customers')}
                      className="text-sm text-blue-600 hover:text-blue-700 font-montserrat"
                    >
                      Lihat semua ({readyCustomers.length})
                    </button>
                  </div>
                )}
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

      {/* Info Modal */}
      <InfoModal
        isOpen={showInfoModal}
        onClose={() => setShowInfoModal(false)}
        title="Statistik Follow-Up"
        items={[
          {
            title: "Customer Aktif",
            description: "Jumlah customer yang sedang dalam sequence follow-up",
            bgColor: "bg-blue-50",
            dotColor: "bg-blue-500",
            titleColor: "text-blue-700"
          },
          {
            title: "Pesan Terkirim",
            description: "Total pesan follow-up yang berhasil dikirim",
            bgColor: "bg-green-50",
            dotColor: "bg-green-500",
            titleColor: "text-green-700"
          },
          {
            title: "Response Rate",
            description: "Persentase customer yang membalas pesan follow-up",
            bgColor: "bg-purple-50",
            dotColor: "bg-purple-500",
            titleColor: "text-purple-700"
          },
          {
            title: "Conversion Rate",
            description: "Persentase customer yang melakukan order setelah follow-up",
            bgColor: "bg-orange-50",
            dotColor: "bg-orange-500",
            titleColor: "text-orange-700"
          }
        ]}
        footerInfo={{
          text: "Statistik ini membantu mengukur efektivitas campaign follow-up Anda"
        }}
      />

      {/* Quick Promo Modal */}
      <QuickPromoModal
        isOpen={showQuickPromoModal}
        onClose={() => setShowQuickPromoModal(false)}
      />

      {/* Tutorial Modal */}
      <TutorialModal
        isOpen={showTutorialModal}
        onClose={() => setShowTutorialModal(false)}
      />
    </div>
  );
};

export default BerandaMarketing;
