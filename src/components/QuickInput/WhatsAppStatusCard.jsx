import React from 'react';
import { RefreshCw } from 'lucide-react';

const WhatsAppStatusCard = ({ waConnected, waStatus, checkingWA, onCheckStatus }) => {
  return (
    <div className="p-3 bg-gray-50 rounded-lg border">
      <div className="flex items-center justify-between mb-2 font-montserrat">
        <h4 className="text-sm font-semibold text-gray-800">Status WhatsApp</h4>
        <button
          onClick={onCheckStatus}
          disabled={checkingWA}
          className="text-xs px-2 py-1 bg-blue-100 rounded hover:bg-blue-200 disabled:opacity-50"
        >
          {checkingWA ? 'Mengecek...' : 'Cek Status'}
        </button>
      </div>
      
      <div className="flex items-center gap-2 mb-2 font-montserrat">
        <div className={`w-3 h-3 rounded-full ${
          waConnected ? 'bg-green-500' : 'bg-red-500'
        }`}></div>
        <span className="text-sm text-gray-700">
          {waConnected ? 'WhatsApp Terhubung' : 'WhatsApp Belum Terhubung'}
        </span>
      </div>
      
      {waStatus && (
        <div className={`text-xs p-2 rounded font-montserrat ${
          waStatus.status === 'success' 
            ? 'bg-green-50 text-green-700 border border-green-200' 
            : waStatus.status === 'warning'
            ? 'bg-yellow-50 text-yellow-700 border border-yellow-200'
            : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {waStatus.message}
        </div>
      )}
      
      {!waConnected && (
        <div className="text-xs text-gray-600 mt-1">
          <a 
            href="/wa-setup" 
            target="_blank" 
            className="text-blue-600 hover:underline"
          >
            Hubungkan WhatsApp di sini
          </a>
        </div>
      )}
    </div>
  );
};

export default WhatsAppStatusCard;
