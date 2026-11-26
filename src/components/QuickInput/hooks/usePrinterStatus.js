import { useState, useEffect } from 'react';
import instance from '../../../config/api';
import { getUserProfile } from '../../../utils/userProfileHelper';

export const usePrinterStatus = () => {
  const [printerStatus, setPrinterStatus] = useState(null);
  const [checkingPrinter, setCheckingPrinter] = useState(false);

  // Check printer status
  const checkPrinterStatus = async () => {
    setCheckingPrinter(true);
    setPrinterStatus(null);
    
    try {
      const profile = await getUserProfile();
      const branchId = profile?.branch?.id;
      const tenantId = profile?.tenant?.id;
      
      if (!branchId) {
        setPrinterStatus({
          status: 'error',
          message: 'Branch ID tidak ditemukan'
        });
        return;
      }

      const response = await instance.get('/printers', {
        params: {
          branch_id: branchId,
          tenant_id: tenantId
        },
        timeout: 10000
      });
      
      if (response.data.success) {
        const printers = response.data.data || [];
        
        if (printers.length === 0) {
          setPrinterStatus({
            status: 'error',
            message: 'Tidak ada printer yang dikonfigurasi untuk cabang ini',
            action: 'setup',
            actionText: 'Setup Printer'
          });
        } else {
          const activePrinters = printers.filter(p => p.status === 'active');
          const defaultPrinter = printers.find(p => p.is_default);
          
          // Cukup ada printer yang terdaftar, tidak perlu aktif
          setPrinterStatus({
            status: 'success',
            message: `${printers.length} printer tersedia`,
            printerCount: printers.length,
            activeCount: activePrinters.length,
            defaultPrinter: defaultPrinter?.name || printers[0]?.name || 'Tidak ada default',
            printers: printers
          });
        }
      } else {
        setPrinterStatus({
          status: 'error',
          message: response.data.message || 'Gagal mengecek status printer'
        });
      }
    } catch (error) {
      console.error('Error checking printer status:', error);
      setPrinterStatus({
        status: 'error',
        message: 'Terjadi kesalahan saat mengecek status printer: ' + (error.response?.data?.message || error.message)
      });
    } finally {
      setCheckingPrinter(false);
    }
  };

  useEffect(() => {
    checkPrinterStatus();
  }, []);

  return {
    printerStatus,
    checkingPrinter,
    checkPrinterStatus
  };
};
