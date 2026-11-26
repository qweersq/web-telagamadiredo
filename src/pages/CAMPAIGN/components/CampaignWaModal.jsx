import { useState, useEffect } from 'react';
import instance from "../../../config/api";
import PhoneInputWithCountry from '../../../components/PhoneInput/PhoneInputWithCountry';

const CampaignWaModal = ({ isOpen, onClose, onWaConnected }) => {
  const [step, setStep] = useState('check'); // check, qr, test, ready
  const [waStatus, setWaStatus] = useState(null);
  const [qrCode, setQrCode] = useState(null);
  const [testPhone, setTestPhone] = useState('');
  const [testMessage, setTestMessage] = useState('Test message dari EllinaLaundry');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showOpenConfirm, setShowOpenConfirm] = useState(false);
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);
  const [pollingInterval, setPollingInterval] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setShowOpenConfirm(true);
    } else {
      // Clear polling interval when modal closes
      if (pollingInterval) {
        clearInterval(pollingInterval);
        setPollingInterval(null);
      }
      
      // Reset states when modal closes
      setStep('check');
      setWaStatus(null);
      setQrCode(null);
      setTestPhone('');
      setError(null);
      setShowOpenConfirm(false);
      setShowCloseConfirm(false);
    }
  }, [isOpen]);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
    };
  }, [pollingInterval]);

  const handleOpenConfirm = async () => {
    setShowOpenConfirm(false);
    await checkWaStatus();
  };

  const handleOpenCancel = () => {
    setShowOpenConfirm(false);
    onClose();
  };

  const handleCloseConfirm = async () => {
    setShowCloseConfirm(false);
    await logoutSession();
    onClose();
  };

  const handleCloseCancel = () => {
    setShowCloseConfirm(false);
  };

  const logoutSession = async () => {
    try {
      await instance.post('/campaigns/wa/logout');
      console.log('✅ Session logged out successfully');
    } catch (error) {
      console.error('❌ Error logging out session:', error);
    }
  };

  const checkWaStatus = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await instance.get('/campaigns/wa/status');
      
      if (response.data.success) {
        const status = response.data.data;
        setWaStatus(status);
        
        if (status.connected && status.status === 'READY') {
          // Jika sudah terhubung dan READY, tampilkan button test manual
          setStep('test');
          onWaConnected(true);
        } else {
          // Jika belum READY (ada session atau tidak), buat session baru
          setStep('qr');
          await connectWaSession();
        }
      } else {
        // Jika tidak ada session sama sekali, buat session baru
        setStep('qr');
        await connectWaSession();
      }
    } catch (error) {
      console.error('❌ Error checking WA status:', error);
      // Jika error, buat session baru
      setStep('qr');
      await connectWaSession();
    } finally {
      setLoading(false);
    }
  };

  const connectWaSession = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await instance.post('/campaigns/wa/connect');
      
      if (response.data.success) {
        const session = response.data.data;
        setWaStatus(session);
        setStep('qr');
        
        // Start polling for status and QR code
        pollWaStatus();
      } else {
        setError('Gagal menghubungkan WhatsApp');
      }
    } catch (error) {
      console.error('❌ Error connecting WA:', error);
      setError('Gagal menghubungkan WhatsApp');
    } finally {
      setLoading(false);
    }
  };


  const pollWaStatus = () => {
    // Clear existing interval if any
    if (pollingInterval) {
      clearInterval(pollingInterval);
      setPollingInterval(null);
    }
    
    const interval = setInterval(async () => {
      try {
        console.log('🔄 Polling WA status and QR code...');
        
        // Poll both status and QR code
        const [statusResponse, qrResponse] = await Promise.all([
          instance.get('/campaigns/wa/status'),
          instance.get('/campaigns/wa/qr')
        ]);
        
        if (statusResponse.data.success) {
          const status = statusResponse.data.data;
          setWaStatus(status);
          
          // If connected and READY, stop polling
          if (status.connected && status.status === 'READY') {
            console.log('✅ WA Connected! Stopping QR polling...');
            setStep('test');
            clearInterval(interval);
            setPollingInterval(null);
            onWaConnected(true);
            return; // Stop here, don't fetch QR anymore
          }
        }
        
        // Keep fetching QR code until connected
        if (qrResponse.data.success && qrResponse.data.data.qr_code) {
          console.log('📱 Got QR code, updating...');
          setQrCode(qrResponse.data.data.qr_code);
        }
      } catch (error) {
        console.error('❌ Error polling WA status:', error);
      }
    }, 3000); // Poll every 3 seconds
    
    // Set interval reference immediately
    setPollingInterval(interval);

    // Stop polling after 5 minutes
    setTimeout(() => {
      console.log('⏰ QR polling timeout after 5 minutes');
      clearInterval(interval);
      setPollingInterval(null);
    }, 300000);
  };

  const autoTestMessage = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await instance.post('/campaigns/wa/test-message', {
        phone: '6282255355701', // Nomor default untuk test
        message: 'Test message otomatis dari EllinaLaundry'
      });
      
      if (response.data.success) {
        setStep('ready');
        onWaConnected(true);
        setError(null);
        alert('✅ Pesan test berhasil dikirim!');
      } else {
        setError(response.data.message || 'Gagal mengirim pesan test');
      }
    } catch (error) {
      console.error('❌ Error sending auto test message:', error);
      setError(error.response?.data?.message || 'Gagal mengirim pesan test otomatis');
    } finally {
      setLoading(false);
    }
  };

  const sendTestMessage = async () => {
    if (!testPhone || !testMessage) {
      setError('Nomor HP dan pesan test harus diisi');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const response = await instance.post('/campaigns/wa/test-message', {
        phone: testPhone,
        message: testMessage
      });
      
      if (response.data.success) {
        setStep('ready');
        onWaConnected(true);
        setError(null);
      } else {
        setError('Gagal mengirim pesan test');
      }
    } catch (error) {
      console.error('❌ Error sending test message:', error);
      setError('Gagal mengirim pesan test');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    // Check if WA is ready and connected
    if (waStatus && waStatus.connected && waStatus.status === 'READY') {
      // If ready, close directly
      onClose();
    } else {
      // If not ready, show confirmation
      setShowCloseConfirm(true);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold">WhatsApp Campaign</h2>
          <button
            onClick={handleClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
            type="button"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Open Confirmation Modal */}
          {showOpenConfirm && (
            <div className="text-center">
              <div className="text-yellow-500 text-6xl mb-4">⚠️</div>
              <h3 className="text-lg font-semibold mb-4">Konfirmasi Hubungkan WhatsApp</h3>
              <p className="text-sm text-gray-600 mb-6">
                Apakah Anda sudah testing kirim WA? Silakan hubungkan ulang jika gagal.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={handleOpenCancel}
                  className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  Batal
                </button>
                <button
                  onClick={handleOpenConfirm}
                  className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  Hubungkan Ulang
                </button>
              </div>
            </div>
          )}

          {/* Close Confirmation Modal */}
          {showCloseConfirm && (
            <div className="text-center">
              <div className="text-red-500 text-6xl mb-4">⚠️</div>
              <h3 className="text-lg font-semibold mb-4">Konfirmasi Tutup Modal</h3>
              <p className="text-sm text-gray-600 mb-6">
                WhatsApp belum siap, yakin mau tutup? Session akan dihapus.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={handleCloseCancel}
                  className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  Batal
                </button>
                <button
                  onClick={handleCloseConfirm}
                  className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                >
                  Ya, Tutup
                </button>
              </div>
            </div>
          )}

          {/* Main Content - Only show if not in confirmation */}
          {!showOpenConfirm && !showCloseConfirm && (
            <>
              {loading && (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                  <p className="text-sm text-gray-600 mt-2">Loading...</p>
                </div>
              )}

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              )}

          {/* Step 1: QR Code */}
          {step === 'qr' && !loading && (
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-4">Scan QR Code</h3>
              <p className="text-sm text-gray-600 mb-4">
                Buka WhatsApp di HP Anda dan scan QR code ini
              </p>
              
              {qrCode ? (
                <div className="bg-gray-100 p-4 rounded-lg mb-4">
                  <img 
                    src={qrCode} 
                    alt="QR Code" 
                    className="mx-auto max-w-48"
                  />
                </div>
              ) : (
                <div className="bg-gray-100 p-8 rounded-lg mb-4">
                  <p className="text-gray-500">Menunggu QR Code...</p>
                </div>
              )}
              
              {/* Session Info */}
              {waStatus?.session_id && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                  <p className="text-xs text-blue-700">
                    <strong>Session ID:</strong> {waStatus.session_id}
                  </p>
                  <p className="text-xs text-blue-700">
                    <strong>Status:</strong> {waStatus.status}
                  </p>
                </div>
              )}
              
              <div className="flex justify-center mt-4">
                <button
                  onClick={handleClose}
                  className="bg-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-400 transition-colors text-sm"
                >
                  Batal
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Manual Test Message */}
          {step === 'test' && !loading && (
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-4">Test WhatsApp</h3>
              <p className="text-sm text-gray-600 mb-4">
                WhatsApp sudah terhubung! Klik tombol di bawah untuk test kirim pesan
              </p>
              
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-green-700">
                  <strong>Status:</strong> {waStatus?.status}
                </p>
                {waStatus?.phone_number && (
                  <p className="text-sm text-green-700">
                    <strong>Phone:</strong> {waStatus.phone_number}
                  </p>
                )}
              </div>
              
              <button
                onClick={autoTestMessage}
                disabled={loading}
                className="w-full px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed mb-4"
              >
                📤 Test Kirim Pesan
              </button>
              
              <p className="text-xs text-gray-500">
                Pesan akan dikirim ke: 6282255355701
              </p>
            </div>
          )}

          {/* Step 3: Manual Test Message */}
          {step === 'manual-test' && !loading && (
            <div>
              <h3 className="text-lg font-semibold mb-4">Test WhatsApp</h3>
              <p className="text-sm text-gray-600 mb-4">
                Kirim pesan test untuk memastikan WhatsApp berfungsi
              </p>
              
              <div className="space-y-4">
                <PhoneInputWithCountry
                  value={testPhone}
                  onChange={setTestPhone}
                  label="Nomor HP Test"
                />
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Pesan Test
                  </label>
                  <textarea
                    value={testMessage}
                    onChange={(e) => setTestMessage(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <button
                  onClick={sendTestMessage}
                  disabled={!testPhone || !testMessage || loading}
                  className="w-full px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  📤 Kirim Test Message
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Ready */}
          {step === 'ready' && !loading && (
            <div className="text-center">
              <div className="text-green-500 text-6xl mb-4">✅</div>
              <h3 className="text-lg font-semibold mb-2">WhatsApp Siap!</h3>
              <p className="text-sm text-gray-600 mb-4">
                WhatsApp campaign sudah terhubung dan siap digunakan
              </p>
              
              {waStatus && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
                  <p className="text-xs text-green-700">
                    <strong>Session ID:</strong> {waStatus.session_id}
                  </p>
                  <p className="text-xs text-green-700">
                    <strong>Status:</strong> {waStatus.status}
                  </p>
                  {waStatus.phone_number && (
                    <p className="text-xs text-green-700">
                      <strong>Phone:</strong> {waStatus.phone_number}
                    </p>
                  )}
                </div>
              )}
              
              <p className="text-xs text-gray-500">
                Status: {waStatus?.status} | Phone: {waStatus?.phone_number}
              </p>
            </div>
          )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-6 border-t">
          <button
            onClick={handleClose}
            className="flex-1 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
          >
            {step === 'ready' ? 'Selesai' : 'Batal'}
          </button>
          
          {step === 'test' && (
            <button
              onClick={checkWaStatus}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              🔄 Refresh Status
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CampaignWaModal;
