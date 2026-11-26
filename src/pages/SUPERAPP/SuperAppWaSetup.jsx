import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import HeaderBerandaOwner from '../../components/Com Header/HeaderBerandaOwner';
import AnimatedButton from '../../components/Design/AnimatedButton';
import instance from '../../config/api';
import { useCurrentUserRole } from '../../utils/roleValidator';
import { getUserProfile } from '../../utils/userProfileHelper';
import { validateFullPhone } from '../../utils/phoneValidation';
import PhoneInputWithCountry from '../../components/PhoneInput/PhoneInputWithCountry';
import { FaArrowLeft, FaCrown } from 'react-icons/fa';

const SuperAppWaSetup = () => {
  const navigate = useNavigate();
  const { userRole } = useCurrentUserRole();
  const [userData, setUserData] = useState(null);
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [qrCode, setQrCode] = useState('');
  const [qrLoading, setQrLoading] = useState(false);
  const [qrError, setQrError] = useState('');
  const [waConnected, setWaConnected] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [testMessage, setTestMessage] = useState('Halo, ini adalah pesan test dari SuperApp Admin');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [messageStatus, setMessageStatus] = useState(null);
  const [sessionAction, setSessionAction] = useState(null);
  const [sessionLoading, setSessionLoading] = useState(false);
  const [sessionResult, setSessionResult] = useState(null);
  const [currentStep, setCurrentStep] = useState(0); // 0: Check Session, 1: QR Code, 2: Status, 3: Test Message
  const [sessionId, setSessionId] = useState(null);
  const [qrRefreshCount, setQrRefreshCount] = useState(0);
  const [autoRefreshInterval, setAutoRefreshInterval] = useState(null);
  const [connectionHistory, setConnectionHistory] = useState([]);
  const [loadingConnections, setLoadingConnections] = useState(false);
  const [connectionStats, setConnectionStats] = useState(null);

  // Load user data and fetch branches on component mount
  useEffect(() => {
    loadUserData();
  }, []);

  // Cleanup auto-refresh on component unmount
  useEffect(() => {
    return () => {
      if (autoRefreshInterval) {
        clearInterval(autoRefreshInterval);
      }
    };
  }, [autoRefreshInterval]);

  // Fetch connection history and stats on component mount
  useEffect(() => {
    if (userData) {
      fetchConnectionHistory();
      fetchConnectionStats();
    }
  }, [userData]);

  const loadUserData = async () => {
    try {
      const profile = await getUserProfile();
      setUserData(profile);
      console.log('✅ SuperAppWaSetup - User data loaded:', profile);
    } catch (error) {
      console.error('❌ SuperAppWaSetup - Failed to load user data:', error);
    }
  };


  const fetchConnectionHistory = async () => {
    try {
      setLoadingConnections(true);
      console.log('🔍 SuperAppWaSetup - Fetching connection history for connection_type: superapp');
      const { data } = await instance.get('/wa-connections/history/superapp', {
        params: {
          limit: 5
        }
      });
      setConnectionHistory(data.data || []);
    } catch (error) {
      console.error('Error fetching connection history:', error);
    } finally {
      setLoadingConnections(false);
    }
  };

  const fetchConnectionStats = async () => {
    try {
      console.log('🔍 SuperAppWaSetup - Fetching connection stats for connection_type: superapp');
      const { data } = await instance.get('/wa-connections/stats/superapp');
      setConnectionStats(data.data);
    } catch (error) {
      console.error('Error fetching connection stats:', error);
    }
  };

  const cleanupOldConnections = async () => {
    try {
      setSessionLoading(true);
      console.log('🧹 Cleaning up old superapp connections...');
      
      const { data } = await instance.post('/wa-connections/cleanup/superapp', {}, {
        timeout: 15000 // 15 second timeout
      });
      
      console.log('🔍 Cleanup response:', data);
      
      if (data.success) {
        setSessionResult({
          status: 'success',
          message: `Berhasil membersihkan ${data.data.cleaned} connection lama`
        });
        
        // Clear current session if it was cleaned up
        setSessionId(null);
        setQrCode('');
        setWaConnected(false);
        setConnectionStatus(null);
        setCurrentStep(0);
        
        // Refresh connection history
        await fetchConnectionHistory();
        await fetchConnectionStats();
      } else {
        setSessionResult({
          status: 'error',
          message: data.message || 'Gagal membersihkan connection lama'
        });
      }
    } catch (error) {
      console.error('❌ Error cleaning up connections:', {
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
          message: 'Terjadi kesalahan saat membersihkan connection: ' + (error.response?.data?.message || error.message)
        });
      }
    } finally {
      setSessionLoading(false);
    }
  };

  const checkAndCreateConnection = async () => {
    setQrLoading(true);
    setQrError('');
    setQrCode('');
    setWaConnected(false);
    setConnectionStatus(null);
    setMessageStatus(null);
    setQrModalOpen(true);
    setCurrentStep(0);
    
    try {
      // Fetch connection history and stats first
      await fetchConnectionHistory();
      await fetchConnectionStats();
      
      // Check for active connections from history
      const activeConnections = connectionHistory.filter(connection => 
        ['PENDING', 'READY'].includes(connection.status)
      );
      
      if (activeConnections.length > 0) {
        const latestConnection = activeConnections[0];
        setSessionId(latestConnection.connection_id);
        
        // Check if connection is still valid
        const statusResponse = await instance.get(`/wa-connections/${latestConnection.connection_id}/status`, {
          timeout: 0
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
          message: `Connection ada tapi menunggu scan QR code`
        });
          return;
        } else {
          // Connection is invalid, cleanup and create new
          setConnectionStatus({
            status: 'info',
            message: `Connection lama tidak valid, akan dibuat connection baru`
          });
          await cleanupOldConnections();
        }
      } else {
        // No active connections, ready to create
        setConnectionStatus({
          status: 'info',
          message: `Siap untuk membuat connection WhatsApp baru`
        });
      }
    } catch (error) {
      console.error('Error checking session:', error);
      setQrError({
        type: 'error',
        message: 'Terjadi kesalahan: ' + (error.response?.data?.message || error.message)
      });
    } finally {
      setQrLoading(false);
    }
  };

  const createNewConnection = async () => {
    setQrLoading(true);
    setQrError('');
    setQrCode('');
    setWaConnected(false);
    setConnectionStatus(null);
    setMessageStatus(null);
    
    try {
      console.log('🔄 Creating new superapp connection...');
      
      // Create new connection with connection_type = 'superapp'
      const createResponse = await instance.post('/wa-connections/create', {
        connection_type: 'superapp'
      }, {
        timeout: 30000 // 30 second timeout
      });
      
      console.log('🔍 Create connection response:', createResponse.data);
      
      if (createResponse.data.success && createResponse.data.data.connection_id) {
        const newConnectionId = createResponse.data.data.connection_id;
        setSessionId(newConnectionId);
        setCurrentStep(1);
        setConnectionStatus({
          status: 'success',
          message: 'Connection berhasil dibuat! Sekarang bisa scan QR code'
        });
        
        // Refresh connection history and stats
        await fetchConnectionHistory();
        await fetchConnectionStats();
        
        await getQRCode(newConnectionId);
      } else {
        console.error('❌ Create connection failed:', createResponse.data);
        setQrError({
          type: 'error',
          message: 'Gagal membuat connection WhatsApp: ' + (createResponse.data.message || 'Unknown error')
        });
      }
    } catch (error) {
      console.error('❌ Error creating connection:', {
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

  const getQRCode = async (connectionId, isAutoRefresh = false) => {
    try {
      if (!isAutoRefresh) {
        setQrLoading(true);
        setQrRefreshCount(prev => prev + 1);
      }
      
      console.log('🔄 Getting QR code for connection:', connectionId);
      
      const qrResponse = await instance.get(`/wa-connections/${connectionId}/qr`, {
        timeout: 15000 // 15 second timeout
      });
      
      console.log('🔍 QR Response:', qrResponse.data);
      
      if (qrResponse.data.success && qrResponse.data.qrCode) {
        setQrCode(qrResponse.data.qrCode);
        setQrError(''); // Clear any previous errors
        console.log('✅ QR code received successfully');
        // Stop auto-refresh if QR code is found
        if (autoRefreshInterval) {
          clearInterval(autoRefreshInterval);
          setAutoRefreshInterval(null);
        }
      } else if (qrResponse.data.success === false && qrResponse.data.message) {
        console.log('⚠️ QR not ready yet:', qrResponse.data.message);
        setQrError({
          type: 'waiting',
          message: qrResponse.data.message
        });
      } else if (qrResponse.data.qrCode) {
        // If QR code exists but success might be false, still show the QR
        setQrCode(qrResponse.data.qrCode);
        setQrError(''); // Clear any previous errors
        console.log('✅ QR code received (success=false but QR exists)');
        // Stop auto-refresh if QR code is found
        if (autoRefreshInterval) {
          clearInterval(autoRefreshInterval);
          setAutoRefreshInterval(null);
        }
      } else {
        console.error('❌ No QR code in response:', qrResponse.data);
        setQrError({
          type: 'error',
          message: 'Gagal mendapatkan QR code dari server'
        });
      }
    } catch (error) {
      console.error('❌ Error fetching QR code:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      
      // Handle specific error types
      if (error.code === 'ECONNABORTED') {
        setQrError({
          type: 'error',
          message: 'Request timeout - Server tidak merespons saat mengambil QR code'
        });
      } else if (error.response?.status === 500) {
        setQrError({
          type: 'error',
          message: 'Server error: ' + (error.response?.data?.message || 'Internal server error')
        });
      } else if (error.response?.status === 404) {
        setQrError({
          type: 'error',
          message: 'Connection tidak ditemukan - silakan buat connection baru'
        });
      } else {
        setQrError({
          type: 'error',
          message: 'Terjadi kesalahan saat mengambil QR code: ' + (error.response?.data?.message || error.message)
        });
      }
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
    await checkAndCreateConnection();
  };

  const checkWAStatus = async () => {
    setTestingConnection(true);
    setConnectionStatus(null);
    
    try {
      if (!sessionId) {
        setWaConnected(false);
        setConnectionStatus({
          status: 'error',
          message: 'Tidak ada connection WhatsApp aktif. Silakan buat connection baru terlebih dahulu.'
        });
        return;
      }
      
      console.log('🔄 Checking WA status for connection:', sessionId);
      
      const response = await instance.get(`/wa-connections/${sessionId}/status`, {
        timeout: 10000 // 10 second timeout
      });
      
      console.log('🔍 Status response:', response.data);
      
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
            message: 'WhatsApp terputus. Silakan buat connection baru.'
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
          message: 'Gagal mendapatkan status WhatsApp dari server: ' + (response.data.message || 'Unknown error')
        });
      }
    } catch (error) {
      console.error('❌ Error testing WhatsApp:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      
      setWaConnected(false);
      setCurrentStep(0);
      
      // Handle specific error types
      if (error.code === 'ECONNABORTED') {
        setConnectionStatus({
          status: 'error',
          message: 'Request timeout - Server tidak merespons saat cek status'
        });
      } else if (error.response?.status === 500) {
        setConnectionStatus({
          status: 'error',
          message: 'Server error: ' + (error.response?.data?.message || 'Internal server error')
        });
      } else if (error.response?.status === 404) {
        setConnectionStatus({
          status: 'error',
          message: 'Connection tidak ditemukan - silakan buat connection baru'
        });
      } else {
        setConnectionStatus({
          status: 'error',
          message: 'Terjadi kesalahan saat testing WhatsApp: ' + (error.response?.data?.message || error.message)
        });
      }
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
          message: 'Tidak ada connection WhatsApp aktif. Silakan buat connection baru terlebih dahulu.'
        });
        return;
      }
      
      const response = await instance.post(`/wa-connections/${sessionId}/send-message`, {
        phone: phoneNumber,
        message: testMessage
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
      title: 'Hubungkan WhatsApp SuperApp',
      description: 'Hubungkan perangkat WhatsApp untuk SuperApp Admin',
      icon: '📱',
      color: 'bg-purple-500',
      onClick: handleScanQR,
      loading: qrLoading
    }
  ];

  const handleBackToDashboard = () => {
    navigate('/superapp-dashboard');
  };

  return (
    <div className="h-[100dvh] flex flex-col overflow-hidden font-montserrat">
        <div className="bg-white shadow-sm border-b flex-shrink-0">
        <div className="px-4 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={handleBackToDashboard}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <FaArrowLeft className="text-gray-600 text-lg" />
            </button>
            <div className="flex items-center gap-3">
              <div>
                <h1 className="text-lg font-semibold font-montserrat text-gray-900">Setup WhatsApp SuperApp</h1>
                <p className="text-sm text-gray-600 font-montserrat">Konfigurasi WhatsApp untuk SuperApp Admin</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Main Content dengan overflow scroll */}
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto px-4 md:px-10 pt-10 pb-6">
          <div className="max-w-[390px] md:max-w-none mx-auto mt-[50px]">


            {/* WhatsApp Status */}
            {connectionStats && (
              <div className="mb-6 bg-purple-50 border border-purple-200 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-purple-800 mb-2">Status WhatsApp SuperApp</h3>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${
                      connectionStats.active > 0 ? 'bg-green-500' : 'bg-gray-400'
                    }`}></div>
                    <div>
                      <div className="text-sm font-medium text-gray-800">
                        {connectionStats.active > 0 ? 'WhatsApp SuperApp Terhubung' : 'WhatsApp SuperApp Belum Terhubung'}
                      </div>
                      <div className="text-xs text-gray-600">
                        {connectionStats.active > 0 
                          ? 'Siap untuk mengirim pesan' 
                          : 'Klik tombol di bawah untuk menghubungkan'
                        }
                      </div>
                    </div>
                  </div>
                  {connectionStats.active > 0 && (
                    <div className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                      Aktif
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* WhatsApp Info */}
            {(
              <div className="mb-6 bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-gray-800 mb-2">Informasi WhatsApp SuperApp</h3>
                <div className="space-y-2 text-xs text-gray-600">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    <span>WhatsApp SuperApp terpisah dari WhatsApp tenant biasa</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span>Digunakan untuk komunikasi admin dan notifikasi sistem</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                    <span>Jika ingin ganti perangkat, hubungkan ulang WhatsApp</span>
                  </div>
                </div>
              </div>
            )}

            {/* WhatsApp Management Actions */}
            {connectionStats && connectionStats.active > 0 && (
              <div className="mb-6">
                <div className="flex gap-2">
                  <AnimatedButton
                    onClick={() => cleanupOldConnections()}
                    disabled={sessionLoading}
                    className="flex-1 py-2 px-4 rounded-xl text-sm bg-orange-50 text-orange-700 border border-orange-200 hover:bg-orange-100"
                    variant="grey"
                  >
                    {sessionLoading ? 'Memutuskan...' : 'Putuskan WhatsApp'}
                  </AnimatedButton>
                  <AnimatedButton
                    onClick={() => {
                      fetchConnectionHistory();
                      fetchConnectionStats();
                    }}
                    disabled={loadingConnections}
                    className="flex-1 py-2 px-4 rounded-xl text-sm bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100"
                    variant="grey"
                  >
                    {loadingConnections ? 'Memuat...' : 'Perbarui Status'}
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
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-purple-500"></div>
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
                      disabled={item.loading}
                      className="w-full h-10 rounded-xl font-medium text-sm"
                      variant="purple"
                    >
                      {item.loading ? 'Memproses...' : 'Hubungkan WhatsApp SuperApp'}
                    </AnimatedButton>
                  </div>
                </div>
              ))}
            </div>
            
          </div>
        </div>
      </main>

      {/* QR Code Modal - Same as tenant version but with SuperApp branding */}
      {qrModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">
                Hubungkan WhatsApp SuperApp
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
                  <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h4 className="text-lg font-semibold text-gray-800 mb-2">
                    Status WhatsApp SuperApp
                  </h4>
                  <p className="text-gray-600 mb-4">
                    {connectionStatus?.message || 'Memeriksa koneksi WhatsApp SuperApp...'}
                  </p>
                  
                  {connectionStatus?.status === 'success' && (
                    <div className="space-y-3">
                      <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                        <p className="text-green-800 text-sm">
                          ✅ WhatsApp SuperApp sudah terhubung dan siap digunakan!
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <AnimatedButton
                          onClick={goToStatusStep}
                          className="flex-1 py-2 px-4 rounded-xl text-sm"
                          variant="purple"
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
                          ⚠️ Connection ada tapi menunggu scan QR code
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <AnimatedButton
                          onClick={goToQRStep}
                          className="flex-1 py-2 px-4 rounded-xl text-sm"
                          variant="purple"
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
                      <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
                        <p className="text-purple-800 text-sm">
                          ℹ️ Siap untuk membuat connection WhatsApp SuperApp baru
                        </p>
                        {connectionStats && (
                          <div className="mt-2 text-xs text-purple-700">
                            <p>Total connection: {connectionStats.total} | Aktif: {connectionStats.active}</p>
                            {connectionStats.active > 0 && (
                              <p className="text-orange-600 font-medium">
                                ⚠️ Ada {connectionStats.active} connection aktif, akan dibersihkan otomatis
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <AnimatedButton
                          onClick={createNewConnection}
                          disabled={qrLoading}
                          className="flex-1 py-2 px-4 rounded-xl text-sm"
                          variant="purple"
                        >
                          {qrLoading ? 'Membuat...' : 'Buat Connection Baru'}
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
                          onClick={createNewConnection}
                          disabled={qrLoading}
                          className="flex-1 py-2 px-4 rounded-xl text-sm"
                          variant="purple"
                        >
                          {qrLoading ? 'Membuat...' : 'Buat Connection Baru'}
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
                    Scan Kode QR SuperApp
                  </h4>
                  <p className="text-gray-600 mb-4">
                    Buka WhatsApp di HP Anda, lalu scan kode QR di bawah ini
                  </p>
                  
                  {/* Refresh QR Code Button */}
                  <div className="mb-4">
                    <AnimatedButton
                      onClick={() => getQRCode(sessionId)}
                      disabled={qrLoading || !sessionId}
                      className="w-full py-2 px-4 rounded-xl text-sm bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100 transition-colors"
                      variant="grey"
                    >
                      {qrLoading ? (
                        <div className="flex items-center justify-center gap-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-500"></div>
                          <span>Memuat QR Code...</span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center gap-2">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                          <span>Perbarui Kode QR</span>
                          {qrRefreshCount > 0 && (
                            <span className="text-xs bg-purple-100 px-2 py-1 rounded-full">
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
                          <p className="text-purple-600 font-medium">
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
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
                      <span className="ml-2 text-gray-600">Memuat QR code...</span>
                    </div>
                  )}
                  
                  {qrCode && (
                    <div className="space-y-4">
                      <div className="flex justify-center">
                        <img 
                          src={qrCode} 
                          alt="WhatsApp SuperApp QR Code" 
                          className="w-64 h-64 border border-gray-200 rounded-lg"
                        />
                      </div>
                      <div className="flex gap-2">
                        <AnimatedButton
                          onClick={checkWAStatus}
                          disabled={testingConnection}
                          className="flex-1 py-2 px-4 rounded-xl text-sm"
                          variant="purple"
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
                    WhatsApp SuperApp Terhubung
                  </h4>
                  <p className="text-gray-600 mb-4">
                    {connectionStatus?.message || 'WhatsApp SuperApp berhasil terhubung!'}
                  </p>
                  
                  <div className="space-y-4">
                    <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                      <p className="text-green-800 text-sm">
                        ✅ WhatsApp SuperApp berhasil terhubung dan siap digunakan!
                      </p>
                    </div>
                    
                    <div className="flex gap-2">
                      <AnimatedButton
                        onClick={() => setCurrentStep(3)}
                        className="flex-1 py-2 px-4 rounded-xl text-sm"
                        variant="purple"
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
                    <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                    </div>
                    <h4 className="text-lg font-semibold text-gray-800 mb-2">
                      Test Pesan WhatsApp SuperApp
                    </h4>
                    <p className="text-gray-600 mb-4">
                      Kirim pesan test untuk memastikan WhatsApp SuperApp berfungsi dengan baik
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
                        placeholder="Halo, ini adalah pesan test dari SuperApp Admin"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent font-montserrat text-sm"
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
                        variant="purple"
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
    </div>
  );
};

export default SuperAppWaSetup;
