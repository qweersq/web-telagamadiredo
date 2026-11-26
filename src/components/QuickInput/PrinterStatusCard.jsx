import React from 'react';
import { RefreshCw } from 'lucide-react';

const PrinterStatusCard = ({ printerStatus, checkingPrinter, onCheckStatus }) => {
  return (
    <div className="p-3 bg-telaga-50/50 rounded-xl border border-telaga-100">
      <div className="flex items-center justify-between mb-2 font-montserrat">
        <h4 className="text-sm font-semibold font-montserrat text-telaga-900">Status Printer</h4>
        <button
          onClick={onCheckStatus}
          disabled={checkingPrinter}
          className="text-xs px-2.5 py-1 bg-telaga-50 text-telaga-700 border border-telaga-100 rounded-lg hover:bg-telaga-100 disabled:opacity-50 font-montserrat font-semibold transition-colors"
        >
          {checkingPrinter ? 'Mengecek...' : 'Cek Status'}
        </button>
      </div>
      
      {printerStatus && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 mb-2 font-montserrat">
            <div className={`w-3 h-3 rounded-full ${
              printerStatus.status === 'success' ? 'bg-telaga-500' : 
              printerStatus.status === 'warning' ? 'bg-senja-500' : 'bg-red-500'
            }`}></div>
            <span className="text-sm text-telaga-900/80 font-montserrat font-medium">
              {printerStatus.status === 'success' ? 'Printer Tersedia' : 'Printer Belum Terhubung'}
            </span>
          </div>
          
          <div className={`text-xs p-2 rounded font-montserrat ${
            printerStatus.status === 'success' 
              ? 'bg-telaga-50 text-telaga-700 border border-telaga-200' 
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}>
            {printerStatus.message}
            {printerStatus.defaultPrinter && (
              <div className="mt-1 text-xs font-montserrat font-medium">
                Default: {printerStatus.defaultPrinter}
              </div>
            )}
            {printerStatus.activeCount !== undefined && printerStatus.activeCount > 0 && (
              <div className="mt-1 text-xs font-montserrat font-medium">
                Aktif: {printerStatus.activeCount} dari {printerStatus.printerCount}
              </div>
            )}
          </div>
          
          {printerStatus.action === 'setup' && (
            <div className="text-xs text-telaga-900/60 mt-1 font-montserrat font-medium">
              <a 
                href="/printer-management" 
                target="_blank" 
                className="text-telaga-600 hover:underline font-montserrat font-semibold"
              >
                {printerStatus.actionText} di sini
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PrinterStatusCard;
