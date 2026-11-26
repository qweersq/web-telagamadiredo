import React, { useState } from 'react';

const WhatsAppModal = ({ show, onClose, order, onWAWeb, onWAApp, onCopyInvoice }) => {
  const [copied, setCopied] = useState(false);
  
  if (!show) return null;

  const handleCopyInvoice = async () => {
    await onCopyInvoice();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-6 sm:p-8" style={{
      paddingTop: 'max(2rem, env(safe-area-inset-top))',
      paddingBottom: 'max(2rem, env(safe-area-inset-bottom))',
      paddingLeft: 'max(2rem, env(safe-area-inset-left))',
      paddingRight: 'max(2rem, env(safe-area-inset-right))'
    }}>
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl flex flex-col max-h-[85vh]">
        {/* Header - Fixed */}
        <div className="flex items-center gap-3 px-6 py-4 border-b-2 border-gray-100 flex-shrink-0 rounded-t-2xl">
          <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
            <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.105"/>
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-800 font-montserrat">Kirim Manual</h3>
            <p className="text-sm text-gray-500 font-montserrat">Pilih cara mengirim invoice secara manual</p>
          </div>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-6" style={{
          WebkitOverflowScrolling: 'touch',
          overscrollBehavior: 'contain'
        }}>
        {/* Customer Info */}
        <div className="bg-gray-50 rounded-xl p-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-gray-800 font-montserrat">
                {order.customer?.name || 'Customer'}
              </h4>
              <p className="text-xs text-gray-600 font-montserrat">
                {order.customer?.phone || 'No phone'}
              </p>
            </div>
          </div>
        </div>

        {/* Options */}
        <div className="space-y-3 mb-6">
          {/* WA Web Option */}
          <button
            onClick={onWAWeb}
            className="w-full p-4 bg-green-50 hover:bg-green-100 border-2 border-green-200 rounded-xl transition-all duration-200 hover:border-green-300"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                </svg>
              </div>
              <div className="text-left">
                <h4 className="text-sm font-semibold text-gray-800 font-montserrat">WhatsApp Web</h4>
                <p className="text-xs text-gray-600 font-montserrat">Buka di browser komputer</p>
              </div>
            </div>
          </button>

          {/* WA App Option */}
          <button
            onClick={onWAApp}
            className="w-full p-4 bg-green-50 hover:bg-green-100 border-2 border-green-200 rounded-xl transition-all duration-200 hover:border-green-300"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-600 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.105"/>
                </svg>
              </div>
              <div className="text-left">
                <h4 className="text-sm font-semibold text-gray-800 font-montserrat">WhatsApp App</h4>
                <p className="text-xs text-gray-600 font-montserrat">Buka aplikasi WhatsApp</p>
              </div>
            </div>
          </button>

          {/* Copy Invoice Option */}
          <button
            onClick={handleCopyInvoice}
            className={`w-full p-4 border-2 rounded-xl transition-all duration-200 ${
              copied 
                ? 'bg-green-50 border-green-300' 
                : 'bg-blue-50 hover:bg-blue-100 border-blue-200 hover:border-blue-300'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                copied ? 'bg-green-500' : 'bg-blue-500'
              }`}>
                {copied ? (
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                )}
              </div>
              <div className="text-left">
                <h4 className={`text-sm font-semibold font-montserrat ${
                  copied ? 'text-green-800' : 'text-gray-800'
                }`}>
                  {copied ? 'Tersalin!' : 'Copy Invoice'}
                </h4>
                <p className={`text-xs font-montserrat ${
                  copied ? 'text-green-600' : 'text-gray-600'
                }`}>
                  {copied ? 'Siap untuk paste' : 'Salin teks invoice untuk kirim manual'}
                </p>
              </div>
            </div>
          </button>
        </div>
        </div>

        {/* Footer - Fixed */}
        <div className="p-6 border-t-2 border-gray-100 flex-shrink-0 rounded-b-2xl bg-white">
          <button
            onClick={onClose}
            className="w-full px-6 py-3 rounded-xl text-sm bg-gray-500 hover:bg-gray-600 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] font-montserrat"
          >
            Batal
          </button>
        </div>
      </div>
    </div>
  );
};

export default WhatsAppModal;
