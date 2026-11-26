import { useState, useEffect } from 'react';
import instance from '../../../config/api';
import { getUserProfile } from '../../../utils/userProfileHelper';

export const useWhatsAppStatus = () => {
  const [waConnected, setWaConnected] = useState(false);
  const [waStatus, setWaStatus] = useState(null);
  const [checkingWA, setCheckingWA] = useState(false);

  // Check WhatsApp connection status
  const checkWhatsAppStatus = async () => {
    setCheckingWA(true);
    setWaStatus(null);
    
    try {
      const profile = await getUserProfile();
      const branchId = profile?.branch?.id;
      
      if (!branchId) {
        setWaStatus({
          status: 'error',
          message: 'Branch ID tidak ditemukan'
        });
        return;
      }

      // Get tenant_id for consistent API call
      const tenantId = profile?.tenant?.id;
      
      const response = await instance.get('/wa-sessions/stats', {
        params: {
          branch_id: branchId,
          tenant_id: tenantId
        },
        timeout: 10000
      });
      
      if (response.data.success) {
        const { data } = response.data;
        const hasActiveSession = data.active > 0;
        const hasReadySession = data.byStatus?.READY > 0;
        
        // Use consistent logic with WaSetup.jsx
        setWaConnected(hasReadySession);
        setWaStatus({
          status: hasReadySession ? 'success' : hasActiveSession ? 'warning' : 'error',
          message: hasReadySession 
            ? 'WhatsApp terhubung dan siap mengirim pesan' 
            : hasActiveSession
            ? 'WhatsApp session ada tapi menunggu scan QR code'
            : 'Tidak ada session WhatsApp aktif. Silakan hubungkan terlebih dahulu.'
        });
      } else {
        setWaConnected(false);
        setWaStatus({
          status: 'error',
          message: response.data.message || 'Gagal mengecek status WhatsApp'
        });
      }
    } catch (error) {
      console.error('Error checking WhatsApp status:', error);
      setWaConnected(false);
      setWaStatus({
        status: 'error',
        message: 'Terjadi kesalahan saat mengecek status WhatsApp'
      });
    } finally {
      setCheckingWA(false);
    }
  };

  useEffect(() => {
    checkWhatsAppStatus();
  }, []);

  return {
    waConnected,
    waStatus,
    checkingWA,
    checkWhatsAppStatus
  };
};
