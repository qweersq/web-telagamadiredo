import { useState, useEffect } from 'react';
import instance from '../../../config/api';
import { getUserProfile } from '../../../utils/userProfileHelper';
import { thermalPrinterService } from '../../../services/thermalPrinterService';

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
          const localPrinter = thermalPrinterService.getLocalPrinter();
          if (localPrinter) {
            setPrinterStatus({
              status: 'success',
              message: 'Printer terhubung langsung dari browser ini',
              printerCount: 1,
              activeCount: 1,
              defaultPrinter: localPrinter.device_name,
              printers: [localPrinter]
            });
          } else {
            setPrinterStatus({
              status: 'error',
              message: 'Belum ada printer. Hubungkan printer Bluetooth dari tombol di atas.'
            });
          }
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
      const localPrinter = thermalPrinterService.getLocalPrinter();
      if (localPrinter) {
        setPrinterStatus({
          status: 'success',
          message: 'Printer terhubung langsung dari browser ini',
          printerCount: 1,
          activeCount: 1,
          defaultPrinter: localPrinter.device_name,
          printers: [localPrinter]
        });
      } else {
        setPrinterStatus({
          status: 'error',
          message: 'Belum ada printer. Hubungkan printer Bluetooth dari tombol di atas.'
        });
      }
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
