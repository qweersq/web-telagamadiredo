import React from 'react';
import AnimatedButton from '../Design/AnimatedButton';

const TreatmentExplanationModal = ({ isOpen, onClose, onConfirm }) => {
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
              Penjelasan Layanan
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Pelajari cara menggunakan fitur layanan
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
          {/* Global Services */}
          <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h4 className="font-bold text-blue-800 text-lg">Layanan</h4>
                <p className="text-blue-700 text-sm">Berlaku untuk seluruh cabang</p>
              </div>
            </div>
            <p className="text-blue-800 text-sm leading-relaxed">
              Layanan yang Anda buat di sini akan <strong>otomatis tersedia di semua cabang</strong>. 
              Setiap cabang dapat melihat dan menggunakan layanan yang sama tanpa perlu membuat ulang.
            </p>
          </div>

          {/* Service Types */}
          <div className="space-y-4">
            <h4 className="font-bold text-gray-800 text-lg">Contoh layanan</h4>
            
            {/* Cuci & Perawatan */}
            <div className="bg-green-50 rounded-lg p-4 border border-green-200">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                  <span className="text-white text-sm">🧽</span>
                </div>
                <h5 className="font-semibold text-green-800">Cuci & Perawatan</h5>
              </div>
              <p className="text-green-700 text-sm">
                Layanan cuci sepatu, tas, helm, jaket, karpet, dan berbagai item lainnya dengan berbagai metode perawatan.
              </p>
            </div>

            {/* Antar Jemput */}
            <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center">
                  <span className="text-white text-sm">🚚</span>
                </div>
                <h5 className="font-semibold text-purple-800">Antar Jemput</h5>
              </div>
              <p className="text-purple-700 text-sm">
                Layanan pengambilan dan pengantaran barang ke alamat pelanggan dengan biaya ongkir yang dapat disesuaikan.
              </p>
            </div>

            {/* Produk & Aksesoris */}
            <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
                  <span className="text-white text-sm">🛍️</span>
                </div>
                <h5 className="font-semibold text-orange-800">Produk & Aksesoris</h5>
              </div>
              <p className="text-orange-700 text-sm">
                Penjualan parfum, pengharum, produk perawatan, dan aksesoris lainnya untuk melengkapi layanan cuci.
              </p>
            </div>

            {/* Layanan Tambahan */}
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 bg-gray-500 rounded-lg flex items-center justify-center">
                  <span className="text-white text-sm">⚙️</span>
                </div>
                <h5 className="font-semibold text-gray-800">Layanan Tambahan</h5>
              </div>
              <p className="text-gray-700 text-sm">
                Garansi, perbaikan, repaint, reglue, filler, dan berbagai layanan khusus lainnya sesuai kebutuhan.
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
                  <li>• Gunakan nama yang jelas dan mudah dipahami</li>
                  <li>• Tentukan harga yang kompetitif untuk setiap layanan</li>
                  <li>• Tambahkan deskripsi untuk kejelasan layanan</li>
                  <li>• Layanan dapat diaktifkan/nonaktifkan sesuai kebutuhan</li>
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

export default TreatmentExplanationModal;
