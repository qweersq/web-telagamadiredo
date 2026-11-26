import React from 'react';
import AnimatedButton from '../Design/AnimatedButton';

const PromoExplanationModal = ({ isOpen, onClose, onConfirm }) => {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-6 sm:p-8"
      style={{ 
        paddingTop: 'max(2rem, env(safe-area-inset-top))',
        paddingBottom: 'max(2rem, env(safe-area-inset-bottom))',
        paddingLeft: 'max(1.5rem, env(safe-area-inset-left))',
        paddingRight: 'max(1.5rem, env(safe-area-inset-right))'
      }}
    >
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full flex flex-col max-h-[85vh]">
        {/* Header - Fixed */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0">
          <div>
            <h3 className="text-xl font-bold text-gray-800 font-montserrat">
              Penjelasan Promo
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Pelajari cara menggunakan fitur promo
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all duration-200"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {/* Content - Scrollable */}
        <div 
          className="p-6 space-y-6 overflow-y-auto flex-1"
          style={{ 
            WebkitOverflowScrolling: 'touch',
            overscrollBehavior: 'contain'
          }}
        >
          {/* Global Promos */}
          <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
              </div>
              <div>
                <h4 className="font-bold text-blue-800 text-lg">Manajemen Promo </h4>
                <p className="text-blue-700 text-sm">Berlaku untuk seluruh outlet</p>
              </div>
            </div>
            <p className="text-blue-800 text-sm leading-relaxed">
              Promo yang Anda buat di sini akan <strong>otomatis tersedia di semua outlet</strong> yang Anda buat. 
              Setiap outlet dapat melihat dan menggunakan promo yang sama tanpa perlu membuat ulang.
            </p>
          </div>

          {/* Promo Types */}
          <div className="space-y-4">
            <h4 className="font-bold text-gray-800 text-lg">Jenis Promo</h4>
            
            {/* Persentase */}
            <div className="bg-green-50 rounded-lg p-4 border border-green-200">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                  <span className="text-white text-sm">%</span>
                </div>
                <h5 className="font-semibold text-green-800">Promo Persentase</h5>
              </div>
              <p className="text-green-700 text-sm">
                Diskon berdasarkan persentase dari total harga. Contoh: 10% dari total belanja.
              </p>
            </div>

            {/* Nominal */}
            <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center">
                  <span className="text-white text-sm">Rp</span>
                </div>
                <h5 className="font-semibold text-purple-800">Promo Nominal</h5>
              </div>
              <p className="text-purple-700 text-sm">
                Diskon dengan nilai tetap dalam Rupiah. Contoh: Potongan Rp 10.000 dari total belanja.
              </p>
            </div>
          </div>

          {/* Management Features */}
          <div className="space-y-4">
            <h4 className="font-bold text-gray-800 text-lg">Fitur Manajemen</h4>
            
            {/* Create Promo */}
            <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
                  <span className="text-white text-sm">+</span>
                </div>
                <h5 className="font-semibold text-orange-800">Buat Promo Baru</h5>
              </div>
              <p className="text-orange-700 text-sm">
                Anda dapat membuat promo baru dengan nama yang jelas dan nilai diskon yang sesuai.
              </p>
            </div>

            {/* Toggle Status */}
            <div className="bg-red-50 rounded-lg p-4 border border-red-200">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 bg-red-500 rounded-lg flex items-center justify-center">
                  <span className="text-white text-sm">⚡</span>
                </div>
                <h5 className="font-semibold text-red-800">Aktifkan/Nonaktifkan</h5>
              </div>
              <p className="text-red-700 text-sm">
                Anda dapat menonaktifkan promo jika tidak berlaku lagi, atau mengaktifkannya kembali sesuai kebutuhan.
              </p>
            </div>

            {/* Edit Promo */}
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 bg-gray-500 rounded-lg flex items-center justify-center">
                  <span className="text-white text-sm">✏️</span>
                </div>
                <h5 className="font-semibold text-gray-800">Edit Promo</h5>
              </div>
              <p className="text-gray-700 text-sm">
                Anda dapat mengubah nama, tipe, atau nilai promo kapan saja sesuai kebutuhan bisnis.
              </p>
            </div>
          </div>

          {/* Tips */}
          <div className="bg-yellow-50 rounded-xl p-4 border border-yellow-200">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-yellow-500 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-white text-sm">💡</span>
              </div>
              <div>
                <h5 className="font-semibold text-yellow-800 mb-2">Tips Penggunaan</h5>
                <ul className="text-yellow-700 text-sm space-y-1">
                  <li>• Gunakan nama promo yang menarik dan mudah diingat</li>
                  <li>• Tentukan nilai diskon yang kompetitif</li>
                  <li>• Nonaktifkan promo yang sudah tidak berlaku</li>
                  <li>• Promo berlaku untuk semua outlet secara otomatis</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
        
        {/* Footer */}
        <div className="flex gap-3 p-6 border-t border-gray-200">
          <AnimatedButton
            onClick={onClose}
            className="flex-1 py-3 px-4 rounded-xl text-sm font-semibold"
            variant="grey"
          >
            Tutup
          </AnimatedButton>
          <AnimatedButton
            onClick={onConfirm}
            className="flex-1 py-3 px-4 rounded-xl text-sm font-semibold"
            variant="blue"
          >
            Mengerti
          </AnimatedButton>
        </div>
      </div>
    </div>
  );
};

export default PromoExplanationModal;
