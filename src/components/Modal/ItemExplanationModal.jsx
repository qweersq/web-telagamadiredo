import React from 'react';
import AnimatedButton from '../Design/AnimatedButton';

const ItemExplanationModal = ({ isOpen, onClose, onConfirm }) => {
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
              Penjelasan Item Management
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Pelajari cara menggunakan fitur pendataan item
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
          {/* Global Items */}
          <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div>
                <h4 className="font-bold text-blue-800 text-lg">Manajemen Item</h4>
                <p className="text-blue-700 text-sm">Berlaku untuk semua outlet</p>
              </div>
            </div>
            <p className="text-blue-800 text-sm leading-relaxed">
              Item yang Anda data di sini akan <strong>otomatis tersedia di semua outlet</strong>. 
              Setiap outlet dapat melihat dan menggunakan database item yang sama untuk pendataan pesanan.
            </p>
          </div>

          {/* Item Types */}
          <div className="space-y-4">
            <h4 className="font-bold text-gray-800 text-lg">Jenis Item yang Dapat Didata</h4>
            
            {/* Sepatu & Alas Kaki */}
            <div className="bg-green-50 rounded-lg p-4 border border-green-200">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                  <span className="text-white text-sm">👟</span>
                </div>
                <h5 className="font-semibold text-green-800">Sepatu & sejenisnya</h5>
              </div>
              <p className="text-green-700 text-sm">
                Sepatu sneakers, boots, heels, sandal, wedges, flat shoes, dan berbagai jenis alas kaki lainnya.
              </p>
            </div>

            {/* Tas & Koper */}
            <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center">
                  <span className="text-white text-sm">👜</span>
                </div>
                <h5 className="font-semibold text-purple-800">Tas & Koper</h5>
              </div>
              <p className="text-purple-700 text-sm">
                Tas tangan, tas ransel, koper, wallet, waist bag, diapers bag, dan berbagai jenis tas lainnya.
              </p>
            </div>

            {/* Helm & Topi */}
            <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
                  <span className="text-white text-sm">⛑️</span>
                </div>
                <h5 className="font-semibold text-orange-800">Helm & Topi</h5>
              </div>
              <p className="text-orange-700 text-sm">
                Helm motor, helm sepeda, topi, beanie, kaca helm, dan berbagai aksesoris kepala lainnya.
              </p>
            </div>

            {/* Pakaian & Tekstil */}
            <div className="bg-pink-50 rounded-lg p-4 border border-pink-200">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 bg-pink-500 rounded-lg flex items-center justify-center">
                  <span className="text-white text-sm">👕</span>
                </div>
                <h5 className="font-semibold text-pink-800">Pakaian & Tekstil</h5>
              </div>
              <p className="text-pink-700 text-sm">
                Jaket, jas, karpet, sabuk, vest, stroller, tenda, dan berbagai item tekstil lainnya.
              </p>
            </div>

            {/* Item Lainnya */}
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 bg-gray-500 rounded-lg flex items-center justify-center">
                  <span className="text-white text-sm">📦</span>
                </div>
                <h5 className="font-semibold text-gray-800">Item Lainnya</h5>
              </div>
              <p className="text-gray-700 text-sm">
                Berbagai item lainnya yang memerlukan layanan cuci dan perawatan khusus.
              </p>
            </div>
          </div>

          {/* Usage in Orders */}
          <div className="bg-yellow-50 rounded-xl p-4 border border-yellow-200">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-yellow-500 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-white text-sm">📋</span>
              </div>
              <div>
                <h5 className="font-semibold text-yellow-800 mb-2">Penggunaan dalam Pesanan</h5>
                <p className="text-yellow-700 text-sm mb-2">
                  Item yang didata di sini dapat dipilih saat membuat pesanan baru di bagian detail pesanan.
                </p>
                <ul className="text-yellow-700 text-sm space-y-1">
                  <li>• Memudahkan identifikasi jenis item pelanggan</li>
                  <li>• Konsistensi data di semua outlet</li>
                  <li>• Mempercepat proses input pesanan</li>
                  <li>• Tracking item yang paling sering dicuci</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Tips */}
          <div className="bg-indigo-50 rounded-xl p-4 border border-indigo-200">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-white text-sm">💡</span>
              </div>
              <div>
                <h5 className="font-semibold text-indigo-800 mb-2">Tips Pendataan Item</h5>
                <ul className="text-indigo-700 text-sm space-y-1">
                  <li>• Gunakan nama yang spesifik dan mudah dikenali</li>
                  <li>• Isi brand untuk memudahkan identifikasi</li>
                  <li>• Tentukan warna dan material dengan jelas</li>
                  <li>• Pilih tipe yang sesuai dengan kategori item</li>
                  <li>• Item dapat diaktifkan/nonaktifkan sesuai kebutuhan</li>
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

export default ItemExplanationModal;
