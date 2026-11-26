import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import HeaderBerandaOwner from '../../components/Com Header/HeaderBerandaOwner';
import AnimatedButton from '../../components/Design/AnimatedButton';
import instance from '../../config/api';
import { useCurrentUserRole } from '../../utils/roleValidator';
import { getUserProfile } from '../../utils/userProfileHelper';
import { validateFullPhone } from '../../utils/phoneValidation';
import PhoneInputWithCountry from '../../components/PhoneInput/PhoneInputWithCountry';

const WaSetup = () => {
  const navigate = useNavigate();
  const { userRole } = useCurrentUserRole();
  const isSuperAdmin = userRole === 'superadmin';
  const [userData, setUserData] = useState(null);
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [qrCode, setQrCode] = useState('');
  const [qrLoading, setQrLoading] = useState(false);
  const [qrError, setQrError] = useState('');
  const [waConnected, setWaConnected] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [testMessage, setTestMessage] = useState('Halo, ini adalah pesan test dari sistem WhatsApp');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [messageStatus, setMessageStatus] = useState(null);
  const [sessionAction, setSessionAction] = useState(null);
  const [sessionLoading, setSessionLoading] = useState(false);
  const [sessionResult, setSessionResult] = useState(null);
  const [currentStep, setCurrentStep] = useState(0); // 0: Check Session, 1: QR Code, 2: Status, 3: Test Message
  const [sessionId, setSessionId] = useState(null);
  const [branches, setBranches] = useState([]);
  const [selectedBranchId, setSelectedBranchId] = useState(null);
  const [loadingBranches, setLoadingBranches] = useState(false);
  const [qrRefreshCount, setQrRefreshCount] = useState(0);
  const [autoRefreshInterval, setAutoRefreshInterval] = useState(null);
  const [sessionHistory, setSessionHistory] = useState([]);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [sessionStats, setSessionStats] = useState(null);
  const [showWarningModal, setShowWarningModal] = useState(false);

  // Load user data and fetch branches on component mount
  useEffect(() => {
    loadUserData();
  }, []);

  // Show warning modal after 3 seconds (only if not dismissed before)
  useEffect(() => {
    const isDismissed = localStorage.getItem('wa-warning-dismissed');
    if (!isDismissed) {
      const timer = setTimeout(() => {
        setShowWarningModal(true);
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, []);

  // Fetch branches when user data is loaded
  useEffect(() => {
    if (userData) {
      fetchBranches();
    }
  }, [userData]);

  // Cleanup auto-refresh on component unmount
  useEffect(() => {
    return () => {
      if (autoRefreshInterval) {
        clearInterval(autoRefreshInterval);
      }
    };
  }, [autoRefreshInterval]);

  // Fetch session history when branch changes
  useEffect(() => {
    if (selectedBranchId) {
      fetchSessionHistory(selectedBranchId);
      fetchSessionStats(selectedBranchId);
      // Refresh branches data to get updated wa_session_id
      fetchBranches();
    }
  }, [selectedBranchId]);

  const loadUserData = async () => {
    try {
      const profile = await getUserProfile();
      setUserData(profile);
      console.log('✅ WaSetup - User data loaded:', profile);
    } catch (error) {
      console.error('❌ WaSetup - Failed to load user data:', error);
    }
  };

  const fetchBranches = async () => {
    try {
      setLoadingBranches(true);
      
      if (isSuperAdmin) {
        // Super admin can see all branches
        const { data } = await instance.get('/branches', {
          params: {
            tenant_id: userData?.tenant?.id
          }
        });
        setBranches(data.data || []);
        
        // Auto-select first branch as default for superadmin
        if (data.data && data.data.length > 0 && !selectedBranchId) {
          const firstBranch = data.data[0];
          setSelectedBranchId(firstBranch.id);
          console.log('✅ WaSetup - Auto-selected first branch for superadmin:', firstBranch.id, firstBranch.name);
        }
      } else {
        // Admin can only see their own branch
        const { data } = await instance.get('/branches', {
          params: {
            tenant_id: userData?.tenant?.id,
            branch_id: userData?.branch?.id
          }
        });
        setBranches(data.data || []);
        
        // Auto-select the admin's branch using their actual branch ID
        if (userData?.branch?.id) {
          setSelectedBranchId(userData.branch.id);
        }
      }
    } catch (error) {
      console.error('Error fetching branches:', error);
    } finally {
      setLoadingBranches(false);
    }
  };

  const fetchSessionHistory = async (branchId) => {
    if (!branchId) return;
    
    try {
      setLoadingSessions(true);
      console.log('🔍 WaSetup - Fetching session history for branch_id:', branchId, 'tenant_id:', userData?.tenant?.id);
      const { data } = await instance.get('/wa-sessions/history', {
        params: {
          branch_id: branchId,
          tenant_id: userData?.tenant?.id,
          limit: 5
        }
      });
      setSessionHistory(data.data || []);
    } catch (error) {
      console.error('Error fetching session history:', error);
    } finally {
      setLoadingSessions(false);
    }
  };

  const fetchSessionStats = async (branchId) => {
    if (!branchId) return;
    
    try {
      console.log('🔍 WaSetup - Fetching session stats for branch_id:', branchId, 'tenant_id:', userData?.tenant?.id);
      const { data } = await instance.get('/wa-sessions/stats', {
        params: {
          branch_id: branchId,
          tenant_id: userData?.tenant?.id
        }
      });
      setSessionStats(data.data);
    } catch (error) {
      console.error('Error fetching session stats:', error);
    }
  };

  const cleanupOldSessions = async (branchId) => {
    if (!branchId) return;
    
    try {
      setSessionLoading(true);
      console.log('🧹 Cleaning up old sessions for branch:', branchId);
      
      const { data } = await instance.post(`/wa-sessions/cleanup/${branchId}`, {}, {
        timeout: 15000 // 15 second timeout
      });
      
      console.log('🔍 Cleanup response:', data);
      
      if (data.success) {
        setSessionResult({
          status: 'success',
          message: `Berhasil membersihkan ${data.data.cleaned} session lama`
        });
        
        // Clear current session if it was cleaned up
        setSessionId(null);
        setQrCode('');
        setWaConnected(false);
        setConnectionStatus(null);
        setCurrentStep(0);
        
        // Refresh session history
        await fetchSessionHistory(branchId);
        await fetchSessionStats(branchId);
      } else {
        setSessionResult({
          status: 'error',
          message: data.message || 'Gagal membersihkan session lama'
        });
      }
    } catch (error) {
      console.error('❌ Error cleaning up sessions:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      
      // Handle specific error types
      if (error.code === 'ECONNABORTED') {
        setSessionResult({
          status: 'error',
          message: 'Request timeout - Server tidak merespons saat cleanup'
        });
      } else if (error.response?.status === 500) {
        setSessionResult({
          status: 'error',
          message: 'Server error: ' + (error.response?.data?.message || 'Internal server error')
        });
      } else {
        setSessionResult({
          status: 'error',
          message: 'Terjadi kesalahan saat membersihkan session: ' + (error.response?.data?.message || error.message)
        });
      }
    } finally {
      setSessionLoading(false);
    }
  };

  const checkAndCreateSession = async () => {
    if (!selectedBranchId) {
      setQrError({
        type: 'error',
        message: 'Pilih cabang terlebih dahulu'
      });
      return;
    }

    setQrLoading(true);
    setQrError('');
    setQrCode('');
    setWaConnected(false);
    setConnectionStatus(null);
    setMessageStatus(null);
    setQrModalOpen(true);
    setCurrentStep(0);
    
    try {
      console.log('🔍 Checking for active session for branch:', selectedBranchId);
      
      // Fetch session history and stats first
      await fetchSessionHistory(selectedBranchId);
      await fetchSessionStats(selectedBranchId);
      
      // Check for active session using the new streamlined API
      try {
        const activeSessionResponse = await instance.get(`/wa-sessions/active/${selectedBranchId}`, {
          timeout: 10000
        });
        
        if (activeSessionResponse.data.success) {
          const activeSession = activeSessionResponse.data.data;
          setSessionId(activeSession.session_id);
          
          console.log('✅ Found active session:', activeSession.session_id, 'status:', activeSession.status);
          
          // Check if session is still valid in WA Gateway
          const statusResponse = await instance.get(`/wa/status?sessionId=${activeSession.session_id}&branchId=${selectedBranchId}`, {
            timeout: 10000
          });
          
          if (statusResponse.data.success && statusResponse.data.status === 'READY') {
            // Session is ready
            setWaConnected(true);
            setConnectionStatus({
              status: 'success',
              message: `WhatsApp sudah terhubung! Status: Siap`
            });
            return;
          } else if (statusResponse.data.success && statusResponse.data.status === 'PENDING') {
            // Session exists but waiting for QR scan
            setConnectionStatus({
              status: 'warning',
              message: `Sesi ada tapi menunggu scan QR code`
            });
            return;
          } else {
            // Session is invalid, cleanup and create new
            setConnectionStatus({
              status: 'info',
              message: `Sesi lama tidak valid, akan dibuat sesi baru`
            });
            await cleanupOldSessions(selectedBranchId);
          }
        }
      } catch (activeSessionError) {
        // No active session found, ready to create
        console.log('ℹ️ No active session found, ready to create new one');
        setConnectionStatus({
          status: 'info',
          message: `Siap untuk membuat sesi WhatsApp baru`
        });
      }
    } catch (error) {
      console.error('❌ Error checking session:', error);
      setQrError({
        type: 'error',
        message: 'Terjadi kesalahan: ' + (error.response?.data?.message || error.message)
      });
    } finally {
      setQrLoading(false);
    }
  };

  const createNewSession = async () => {
    if (!selectedBranchId) {
      setQrError({
        type: 'error',
        message: 'Pilih cabang terlebih dahulu'
      });
      return;
    }

    setQrLoading(true);
    setQrError('');
    setQrCode('');
    setWaConnected(false);
    setConnectionStatus(null);
    setMessageStatus(null);
    
    try {
      console.log('🔄 Creating new session for branch:', selectedBranchId);
      
      // Create new session with branch_id (automatically cleans up old sessions)
      const createResponse = await instance.post('/wa/session/create', {
        branch_id: selectedBranchId,
        session_type: 'tenant'
      }, {
        timeout: 30000 // 30 second timeout
      });
      
      console.log('🔍 Create session response:', createResponse.data);
      
      if (createResponse.data.success && createResponse.data.sessionId) {
        const newSessionId = createResponse.data.sessionId;
        setSessionId(newSessionId);
        setCurrentStep(1);
        setConnectionStatus({
          status: 'success',
          message: 'Sesi berhasil dibuat! Sekarang bisa scan QR code'
        });
        
        // Refresh session history and stats
        await fetchSessionHistory(selectedBranchId);
        await fetchSessionStats(selectedBranchId);
        
        await getQRCode(newSessionId);
      } else {
        console.error('❌ Create session failed:', createResponse.data);
        setQrError({
          type: 'error',
          message: 'Gagal membuat sesi WhatsApp: ' + (createResponse.data.message || 'Unknown error')
        });
      }
    } catch (error) {
      console.error('❌ Error creating session:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      
      // Handle specific error types
      if (error.code === 'ECONNABORTED') {
        setQrError({
          type: 'error',
          message: 'Request timeout - Server tidak merespons. Pastikan WA Gateway berjalan.'
        });
      } else if (error.response?.status === 500) {
        setQrError({
          type: 'error',
          message: 'Server error: ' + (error.response?.data?.message || 'Internal server error')
        });
      } else if (error.response?.status === 400) {
        setQrError({
          type: 'error',
          message: 'Request error: ' + (error.response?.data?.message || 'Bad request')
        });
      } else {
        setQrError({
          type: 'error',
          message: 'Terjadi kesalahan: ' + (error.response?.data?.message || error.message)
        });
      }
    } finally {
      setQrLoading(false);
    }
  };

  const getQRCode = async (sessionId, isAutoRefresh = false) => {
    try {
      if (!isAutoRefresh) {
        setQrLoading(true);
        setQrRefreshCount(prev => prev + 1);
      }
      
      const qrResponse = await instance.get(`/wa/qr?sessionId=${sessionId}&branchId=${selectedBranchId}`, {
        timeout: 0
      });
      
      console.log('QR Response:', qrResponse.data); // Debug log
      
      if (qrResponse.data.success && qrResponse.data.qrCode) {
        setQrCode(qrResponse.data.qrCode);
        setQrError(''); // Clear any previous errors
        // Stop auto-refresh if QR code is found
        if (autoRefreshInterval) {
          clearInterval(autoRefreshInterval);
          setAutoRefreshInterval(null);
        }
      } else if (qrResponse.data.success === false && qrResponse.data.message) {
        setQrError({
          type: 'waiting',
          message: qrResponse.data.message
        });
      } else if (qrResponse.data.qrCode) {
        // If QR code exists but success might be false, still show the QR
        setQrCode(qrResponse.data.qrCode);
        setQrError(''); // Clear any previous errors
        // Stop auto-refresh if QR code is found
        if (autoRefreshInterval) {
          clearInterval(autoRefreshInterval);
          setAutoRefreshInterval(null);
        }
      } else {
        setQrError({
          type: 'error',
          message: 'Gagal mendapatkan QR code dari server'
        });
      }
    } catch (error) {
      console.error('Error fetching QR code:', error);
      setQrError({
        type: 'error',
        message: 'Terjadi kesalahan saat mengambil QR code: ' + (error.response?.data?.message || error.message)
      });
    } finally {
      if (!isAutoRefresh) {
        setQrLoading(false);
      }
    }
  };

  // Auto-refresh QR code every 3 seconds if no QR code is shown
  const startAutoRefresh = () => {
    if (autoRefreshInterval) {
      clearInterval(autoRefreshInterval);
    }
    
    const interval = setInterval(() => {
      if (sessionId && !qrCode && currentStep === 1) {
        console.log('Auto-refreshing QR code...');
        getQRCode(sessionId, true);
      }
    }, 3000);
    
    setAutoRefreshInterval(interval);
  };

  const stopAutoRefresh = () => {
    if (autoRefreshInterval) {
      clearInterval(autoRefreshInterval);
      setAutoRefreshInterval(null);
    }
  };

  const handleScanQR = async () => {
    await checkAndCreateSession();
  };

  const checkWAStatus = async () => {
    setTestingConnection(true);
    setConnectionStatus(null);
    
    try {
      if (!sessionId) {
        setWaConnected(false);
        setConnectionStatus({
          status: 'error',
          message: 'Tidak ada sesi WhatsApp aktif. Silakan buat sesi baru terlebih dahulu.'
        });
        return;
      }
      
      const response = await instance.get(`/wa/status?sessionId=${sessionId}&branchId=${selectedBranchId}`, {
        timeout: 0 // No timeout - wait indefinitely
      });
      
      if (response.data.success) {
        const { status } = response.data;
        
        if (status === 'READY') {
          setWaConnected(true);
          setCurrentStep(2);
          setConnectionStatus({
            status: 'success',
            message: 'WhatsApp terhubung dengan baik! Status: Siap'
          });
        } else if (status === 'PENDING') {
          setWaConnected(false);
          setCurrentStep(1);
          setConnectionStatus({
            status: 'warning',
            message: 'WhatsApp menunggu scan QR code. Silakan scan QR code terlebih dahulu.'
          });
        } else if (status === 'DISCONNECTED') {
          setWaConnected(false);
          setCurrentStep(0);
          setConnectionStatus({
            status: 'error',
            message: 'WhatsApp terputus. Silakan buat sesi baru.'
          });
        } else if (status === 'FAILED') {
          setWaConnected(false);
          setCurrentStep(0);
          setConnectionStatus({
            status: 'error',
            message: 'Autentikasi WhatsApp gagal. Silakan coba lagi.'
          });
        } else {
          setWaConnected(false);
          setCurrentStep(0);
          setConnectionStatus({
            status: 'error',
            message: `Status WhatsApp: ${status}. Silakan coba lagi.`
          });
        }
      } else {
        setWaConnected(false);
        setCurrentStep(0);
        setConnectionStatus({
          status: 'error',
          message: 'Gagal mendapatkan status WhatsApp dari server'
        });
      }
    } catch (error) {
      console.error('Error testing WhatsApp:', error);
      setWaConnected(false);
      setCurrentStep(0);
      setConnectionStatus({
        status: 'error',
        message: 'Terjadi kesalahan saat testing WhatsApp: ' + (error.response?.data?.message || error.message)
      });
    } finally {
      setTestingConnection(false);
    }
  };

  const goToQRStep = () => {
    if (sessionId) {
      setCurrentStep(1);
      setQrCode(''); // Clear previous QR code
      setQrRefreshCount(0); // Reset refresh count
      getQRCode(sessionId);
      // Start auto-refresh after a short delay
      setTimeout(() => {
        startAutoRefresh();
      }, 2000);
    }
  };

  const goToStatusStep = () => {
    setCurrentStep(2);
  };

  const sendTestMessage = async () => {
    if (!phoneNumber || !testMessage) {
      setMessageStatus({
        status: 'error',
        message: 'Mohon isi nomor telepon dan pesan'
      });
      return;
    }

    const phoneError = validateFullPhone(phoneNumber);
    if (phoneError) { setMessageStatus({ status: 'error', message: phoneError }); return; }

    setSendingMessage(true);
    setMessageStatus(null);
    
    try {
      if (!sessionId) {
        setMessageStatus({
          status: 'error',
          message: 'Tidak ada sesi WhatsApp aktif. Silakan buat sesi baru terlebih dahulu.'
        });
        return;
      }
      
      const response = await instance.post('/wa/send-message', {
        phone: phoneNumber,
        message: testMessage,
        sessionId: sessionId,
        branch_id: selectedBranchId
      }, {
        timeout: 0 // No timeout - wait indefinitely
      });
      
      if (response.data.success) {
        setMessageStatus({
          status: 'success',
          message: 'Pesan berhasil dikirim!'
        });
        setCurrentStep(3);
      } else {
        setMessageStatus({
          status: 'error',
          message: response.data.message || 'Gagal mengirim pesan'
        });
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setMessageStatus({
        status: 'error',
        message: 'Terjadi kesalahan saat mengirim pesan: ' + (error.response?.data?.message || error.message)
      });
    } finally {
      setSendingMessage(false);
    }
  };

  const closeQrModal = () => {
    stopAutoRefresh(); // Stop auto-refresh when closing modal
    setQrModalOpen(false);
    setQrCode('');
    setQrError('');
    setWaConnected(false);
    setConnectionStatus(null);
    setMessageStatus(null);
    setCurrentStep(0);
    setSessionId(null);
    setQrRefreshCount(0);
  };

  const menuItems = [
    {
      title: 'Hubungkan WhatsApp',
      description: 'Hubungkan perangkat WhatsApp ke cabang ini',
      icon: '📱',
      color: 'bg-green-500',
      onClick: handleScanQR,
      loading: qrLoading
    }
  ];

  return (
    <div className="h-[100dvh] flex flex-col overflow-hidden font-montserrat">
      <HeaderBerandaOwner 
        title="Setup WhatsApp"
        description="Konfigurasi WhatsApp untuk setiap cabang"
        showBackButton={true}
        fromBerandaOwner={true}
        currentTime={new Date().toLocaleTimeString()}
      />
      
      {/* Main Content dengan overflow scroll */}
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto px-4 md:px-10 pt-10 pb-6">
          <div className="max-w-[390px] md:max-w-none mx-auto mt-[50px]">

            {/* Branch Selection - Only show for Super Admin */}
            {isSuperAdmin && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Pilih Cabang untuk Setup WhatsApp
                </label>
                <select
                  value={selectedBranchId || ''}
                  onChange={(e) => setSelectedBranchId(parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-montserrat text-sm"
                  disabled={loadingBranches}
                >
                  <option value="">{loadingBranches ? 'Memuat cabang...' : 'Pilih cabang'}</option>
                  {branches.map((branch) => (
                    <option key={branch.id} value={branch.id}>
                      {branch.name} {selectedBranchId === branch.id && sessionStats 
                        ? (sessionStats.active > 0 ? '(WA: Terhubung)' : '(WA: Belum terhubung)')
                        : branch.wa_session_id 
                          ? '(WA: Terhubung)' 
                          : '(WA: Belum terhubung)'
                      }
                    </option>
                  ))}
                </select>
                {selectedBranchId && (
                  <p className="text-xs text-gray-500 mt-1">
                    WhatsApp akan dikonfigurasi untuk cabang yang dipilih
                  </p>
                )}
              </div>
            )}

            {/* Branch Info for Admin */}
            {!isSuperAdmin && userData && (
              <div className="mb-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  {/* <h3 className="text-sm font-medium text-blue-800 mb-1">
                    Cabang Anda
                  </h3> */}
                  <p className="text-sm text-blue-700">
                    {userData.branch?.name || 'Cabang tidak ditemukan'}
                  </p>
                  <p className="text-xs text-blue-600 mt-1">
                    WhatsApp akan dikonfigurasi untuk cabang ini
                  </p>
                </div>
              </div>
            )}

            {/* WhatsApp Status */}
            {/* {selectedBranchId && sessionStats && (
              <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-blue-800 mb-2">Status WhatsApp</h3>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${
                      sessionStats.active > 0 ? 'bg-green-500' : 'bg-gray-400'
                    }`}></div>
                    <div>
                      <div className="text-sm font-medium text-gray-800">
                        {sessionStats.active > 0 ? 'WhatsApp Terhubung' : 'WhatsApp Belum Terhubung'}
                      </div>
                      <div className="text-xs text-gray-600">
                        {sessionStats.active > 0 
                          ? 'Siap untuk mengirim pesan' 
                          : 'Klik tombol di bawah untuk menghubungkan'
                        }
                      </div>
                    </div>
                  </div>
                  {sessionStats.active > 0 && (
                    <div className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                      Aktif
                    </div>
                  )}
                </div>
              </div>
            )} */}

            {/* WhatsApp Info */}
            {selectedBranchId && (
              <div className="mb-6 bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-gray-800 mb-2">Informasi WhatsApp</h3>
                <div className="space-y-2 text-xs text-gray-600">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>WhatsApp akan terhubung ke perangkat yang Anda pilih</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span>Setiap cabang hanya bisa terhubung ke 1 perangkat WhatsApp</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                    <span>Jika ingin ganti perangkat, hubungkan ulang WhatsApp</span>
                  </div>
                </div>
              </div>
            )}

            {/* WhatsApp Management Actions */}
            {selectedBranchId && sessionStats && sessionStats.active > 0 && (
              <div className="mb-6">
                <div className="flex gap-2">
                  <AnimatedButton
                    onClick={() => cleanupOldSessions(selectedBranchId)}
                    disabled={sessionLoading}
                    className="flex-1 py-2 px-4 rounded-xl text-sm bg-orange-50 text-orange-700 border border-orange-200 hover:bg-orange-100"
                    variant="grey"
                  >
                    {sessionLoading ? 'Memutuskan...' : 'Putuskan WhatsApp'}
                  </AnimatedButton>
                  <AnimatedButton
                    onClick={() => {
                      fetchSessionHistory(selectedBranchId);
                      fetchSessionStats(selectedBranchId);
                    }}
                    disabled={loadingSessions}
                    className="flex-1 py-2 px-4 rounded-xl text-sm bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100"
                    variant="grey"
                  >
                    {loadingSessions ? 'Memuat...' : 'Perbarui Status'}
                  </AnimatedButton>
                </div>
                {sessionResult && (
                  <div className={`mt-2 p-2 rounded text-xs ${
                    sessionResult.status === 'success' 
                      ? 'bg-green-50 text-green-700 border border-green-200' 
                      : 'bg-red-50 text-red-700 border border-red-200'
                  }`}>
                    {sessionResult.message}
                  </div>
                )}
              </div>
            )}

            {/* Menu Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {menuItems.map((item, index) => (
                <div
                  key={index}
                  className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow cursor-pointer border border-gray-100"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl ${item.color} flex items-center justify-center text-white text-xl`}>
                      {item.icon}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-800 mb-1">
                        {item.title}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {item.description}
                      </p>
                    </div>
                    <div className="text-gray-400">
                      {item.loading ? (
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
                      ) : (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={2}
                          stroke="currentColor"
                          className="w-5 h-5"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M8.25 4.5l7.5 7.5-7.5 7.5"
                          />
                        </svg>
                      )}
                    </div>
                  </div>
                  
                  {/* Action Button */}
                  <div className="mt-4">
                    <AnimatedButton
                      onClick={item.onClick}
                      disabled={item.loading || !selectedBranchId}
                      className="w-full h-10 rounded-xl font-medium text-sm"
                      variant="blue"
                    >
                      {item.loading ? 'Memproses...' : 'Hubungkan WhatsApp'}
                    </AnimatedButton>
                  </div>
                </div>
              ))}
            </div>
            
          </div>
        </div>
      </main>

      {/* QR Code Modal */}
      {qrModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">
                Hubungkan WhatsApp
              </h3>
              <button
                onClick={closeQrModal}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-6">
              
              {/* Step 0: Check Session */}
              {currentStep === 0 && (
                <div className="text-center">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h4 className="text-lg font-semibold text-gray-800 mb-2">
                    Status WhatsApp
                  </h4>
                  <p className="text-gray-600 mb-4">
                    {connectionStatus?.message || 'Memeriksa koneksi WhatsApp...'}
                  </p>
                  
                  {connectionStatus?.status === 'success' && (
                    <div className="space-y-3">
                      <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                        <p className="text-green-800 text-sm">
                          ✅ WhatsApp sudah terhubung dan siap digunakan!
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <AnimatedButton
                          onClick={goToStatusStep}
                          className="flex-1 py-2 px-4 rounded-xl text-sm"
                          variant="blue"
                        >
                          Lanjut ke Status
                        </AnimatedButton>
                        <AnimatedButton
                          onClick={closeQrModal}
                          className="flex-1 py-2 px-4 rounded-xl text-sm"
                          variant="grey"
                        >
                          Tutup
                        </AnimatedButton>
                      </div>
                    </div>
                  )}
                  
                  {connectionStatus?.status === 'warning' && (
                    <div className="space-y-3">
                      <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <p className="text-yellow-800 text-sm">
                          ⚠️ Sesi ada tapi menunggu scan QR code
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <AnimatedButton
                          onClick={goToQRStep}
                          className="flex-1 py-2 px-4 rounded-xl text-sm"
                          variant="blue"
                        >
                          Lihat QR Code
                        </AnimatedButton>
                        <AnimatedButton
                          onClick={closeQrModal}
                          className="flex-1 py-2 px-4 rounded-xl text-sm"
                          variant="grey"
                        >
                          Tutup
                        </AnimatedButton>
                      </div>
                    </div>
                  )}
                  
                  {connectionStatus?.status === 'info' && (
                    <div className="space-y-3">
                      <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-blue-800 text-sm">
                          ℹ️ Siap untuk membuat sesi WhatsApp baru
                        </p>
                        {sessionStats && (
                          <div className="mt-2 text-xs text-blue-700">
                            <p>Total session: {sessionStats.total} | Aktif: {sessionStats.active}</p>
                            {sessionStats.active > 0 && (
                              <p className="text-orange-600 font-medium">
                                ⚠️ Ada {sessionStats.active} session aktif, akan dibersihkan otomatis
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <AnimatedButton
                          onClick={createNewSession}
                          disabled={qrLoading}
                          className="flex-1 py-2 px-4 rounded-xl text-sm"
                          variant="blue"
                        >
                          {qrLoading ? 'Membuat...' : 'Buat Sesi Baru'}
                        </AnimatedButton>
                        <AnimatedButton
                          onClick={closeQrModal}
                          className="flex-1 py-2 px-4 rounded-xl text-sm"
                          variant="grey"
                        >
                          Tutup
                        </AnimatedButton>
                      </div>
                    </div>
                  )}
                  
                  {connectionStatus?.status === 'error' && (
                    <div className="space-y-3">
                      <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-red-800 text-sm">
                          ❌ {connectionStatus.message}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <AnimatedButton
                          onClick={createNewSession}
                          disabled={qrLoading}
                          className="flex-1 py-2 px-4 rounded-xl text-sm"
                          variant="blue"
                        >
                          {qrLoading ? 'Membuat...' : 'Buat Sesi Baru'}
                        </AnimatedButton>
                        <AnimatedButton
                          onClick={closeQrModal}
                          className="flex-1 py-2 px-4 rounded-xl text-sm"
                          variant="grey"
                        >
                          Tutup
                        </AnimatedButton>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Step 1: QR Code */}
              {currentStep === 1 && (
                <div className="text-center">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h4 className="text-lg font-semibold text-gray-800 mb-2">
                    Scan Kode QR
                  </h4>
                  <p className="text-gray-600 mb-4">
                    Buka WhatsApp di HP Anda, lalu scan kode QR di bawah ini
                  </p>
                  
                  {/* Refresh QR Code Button */}
                  <div className="mb-4">
                    <AnimatedButton
                      onClick={() => getQRCode(sessionId)}
                      disabled={qrLoading || !sessionId}
                      className="w-full py-2 px-4 rounded-xl text-sm bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition-colors"
                      variant="grey"
                    >
                      {qrLoading ? (
                        <div className="flex items-center justify-center gap-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                          <span>Memuat QR Code...</span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center gap-2">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                          <span>Perbarui Kode QR</span>
                          {qrRefreshCount > 0 && (
                            <span className="text-xs bg-blue-100 px-2 py-1 rounded-full">
                              {qrRefreshCount}x
                            </span>
                          )}
                        </div>
                      )}
                    </AnimatedButton>
                    <div className="text-xs text-gray-500 mt-1 text-center space-y-1">
                      <p>QR code kadang membutuhkan waktu untuk muncul.</p>
                      {autoRefreshInterval && (
                        <div className="flex items-center justify-center gap-2">
                          <p className="text-blue-600 font-medium">
                            🔄 Auto-refresh aktif setiap 3 detik
                          </p>
                          <button
                            onClick={stopAutoRefresh}
                            className="text-red-600 hover:text-red-800 underline"
                          >
                            Hentikan
                          </button>
                        </div>
                      )}
                      {qrRefreshCount > 0 && (
                        <p className="text-gray-600">
                          Sudah di-refresh {qrRefreshCount} kali
                        </p>
                      )}
                    </div>
                  </div>
                  
                  {qrLoading && (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                      <span className="ml-2 text-gray-600">Memuat QR code...</span>
                    </div>
                  )}
                  
                  {qrCode && (
                    <div className="space-y-4">
                      <div className="flex justify-center">
                        <img 
                          src={qrCode} 
                          alt="WhatsApp QR Code" 
                          className="w-64 h-64 border border-gray-200 rounded-lg"
                        />
                      </div>
                      <div className="flex gap-2">
                        <AnimatedButton
                          onClick={checkWAStatus}
                          disabled={testingConnection}
                          className="flex-1 py-2 px-4 rounded-xl text-sm"
                          variant="blue"
                        >
                          {testingConnection ? 'Mengecek...' : 'Cek Status'}
                        </AnimatedButton>
                        <AnimatedButton
                          onClick={closeQrModal}
                          className="flex-1 py-2 px-4 rounded-xl text-sm"
                          variant="grey"
                        >
                          Tutup
                        </AnimatedButton>
                      </div>
                    </div>
                  )}
                  
                  {qrError && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-red-800 text-sm">
                        {qrError.type === 'waiting' ? '⏳' : '❌'} {qrError.message}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Step 2: Status */}
              {currentStep === 2 && (
                <div className="text-center">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h4 className="text-lg font-semibold text-gray-800 mb-2">
                    WhatsApp Terhubung
                  </h4>
                  <p className="text-gray-600 mb-4">
                    {connectionStatus?.message || 'WhatsApp berhasil terhubung!'}
                  </p>
                  
                  <div className="space-y-4">
                    <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                      <p className="text-green-800 text-sm">
                        ✅ WhatsApp berhasil terhubung dan siap digunakan!
                      </p>
                    </div>
                    
                    <div className="flex gap-2">
                      <AnimatedButton
                        onClick={() => setCurrentStep(3)}
                        className="flex-1 py-2 px-4 rounded-xl text-sm"
                        variant="blue"
                      >
                        Test Kirim Pesan
                      </AnimatedButton>
                      <AnimatedButton
                        onClick={closeQrModal}
                        className="flex-1 py-2 px-4 rounded-xl text-sm"
                        variant="grey"
                      >
                        Tutup
                      </AnimatedButton>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Test Message */}
              {currentStep === 3 && (
                <div className="space-y-4">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                    </div>
                    <h4 className="text-lg font-semibold text-gray-800 mb-2">
                      Test Pesan WhatsApp
                    </h4>
                    <p className="text-gray-600 mb-4">
                      Kirim pesan test untuk memastikan WhatsApp berfungsi dengan baik
                    </p>
                  </div>
                  
                  <div className="space-y-4">
                    <PhoneInputWithCountry
                      value={phoneNumber}
                      onChange={setPhoneNumber}
                      label="Nomor Telepon"
                    />
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Pesan Test
                      </label>
                      <textarea
                        rows={3}
                        placeholder="Halo, ini adalah pesan test dari sistem WhatsApp"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-montserrat text-sm"
                        value={testMessage}
                        onChange={(e) => setTestMessage(e.target.value)}
                      />
                    </div>
                    
                    {messageStatus && (
                      <div className={`p-3 rounded-lg border ${
                        messageStatus.status === 'success' 
                          ? 'bg-green-50 border-green-200' 
                          : 'bg-red-50 border-red-200'
                      }`}>
                        <p className={`text-sm ${
                          messageStatus.status === 'success' 
                            ? 'text-green-800' 
                            : 'text-red-800'
                        }`}>
                          {messageStatus.status === 'success' ? '✅' : '❌'} {messageStatus.message}
                        </p>
                      </div>
                    )}
                    
                    <div className="flex gap-2">
                      <AnimatedButton
                        onClick={sendTestMessage}
                        disabled={sendingMessage || !phoneNumber || !testMessage}
                        className="flex-1 py-2 px-4 rounded-xl text-sm"
                        variant="blue"
                      >
                        {sendingMessage ? 'Mengirim...' : 'Kirim Test Pesan'}
                      </AnimatedButton>
                      <AnimatedButton
                        onClick={closeQrModal}
                        className="flex-1 py-2 px-4 rounded-xl text-sm"
                        variant="grey"
                      >
                        Selesai
                      </AnimatedButton>
                    </div>
                  </div>
                </div>
              )}
              
            </div>
          </div>
        </div>
      )}

      {/* Warning Modal */}
      {showWarningModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-gray-800">
                  ⚠️ Peringatan Penting
                </h3>
              </div>
              <button
                onClick={() => setShowWarningModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h4 className="font-semibold text-red-800 mb-2 text-sm">
                  🚨 Risiko Akun WhatsApp
                </h4>
                <p className="text-red-700 text-sm leading-relaxed">
                  Menggunakan WhatsApp otomatis ini <strong>berisiko akun WA terkena suspend dan banned</strong>. 
                  Berhati-hati jangan gunakan untuk spam!
                </p>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h4 className="font-semibold text-yellow-800 mb-2 text-sm">
                  ⚖️ Tanggung Jawab
                </h4>
                <p className="text-yellow-700 text-sm leading-relaxed">
                  <strong>Kami tidak bertanggung jawab</strong> jika WA akun Anda terkena banned akibat penggunaan fitur ini.
                </p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-blue-800 mb-2 text-sm">
                  💡 Saran Penggunaan
                </h4>
                <div className="space-y-2 text-blue-700 text-sm">
                  <div className="flex items-start gap-2">
                    <span className="text-blue-600 font-bold">•</span>
                    <span>Gunakan <strong>WA kedua</strong> untuk pesan otomatis ini</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-blue-600 font-bold">•</span>
                    <span>Untuk broadcast atau notifikasi otomatis, gunakan WA yang <strong>berbeda dari akun utama bisnis</strong> Anda</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-blue-600 font-bold">•</span>
                    <span>Hindari mengirim pesan dalam jumlah besar atau spam</span>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h4 className="font-semibold text-gray-800 mb-2 text-sm">
                  📋 Best Practices
                </h4>
                <div className="space-y-1 text-gray-700 text-sm">
                  <p>• Kirim pesan dengan interval yang wajar (minimal 1-2 detik antar pesan)</p>
                  <p>• Gunakan untuk notifikasi penting saja, bukan promosi massal</p>
                  <p>• Monitor status akun WA secara berkala</p>
                  <p>• Siapkan backup akun WA untuk keperluan bisnis</p>
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <AnimatedButton
                onClick={() => setShowWarningModal(false)}
                className="flex-1 py-3 px-4 rounded-xl text-sm font-semibold"
                variant="blue"
              >
                Saya Mengerti
              </AnimatedButton>
              <AnimatedButton
                onClick={() => {
                  setShowWarningModal(false);
                  // Optional: Add checkbox to remember this choice
                  localStorage.setItem('wa-warning-dismissed', 'true');
                }}
                className="flex-1 py-3 px-4 rounded-xl text-sm font-semibold bg-gray-100 text-gray-700 hover:bg-gray-200"
                variant="grey"
              >
                Jangan Tampilkan Lagi
              </AnimatedButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WaSetup;
