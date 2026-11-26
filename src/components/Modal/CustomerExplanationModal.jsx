import React from 'react';
import AnimatedButton from '../Design/AnimatedButton';

const CustomerExplanationModal = ({ isOpen, onClose, onConfirm }) => {
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
              Penjelasan Manajemen Pelanggan
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Pelajari cara menggunakan fitur manajemen pelanggan
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
          {/* Global Customer Management */}
          <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div>
                <h4 className="font-bold text-blue-800 text-lg">Manajemen Pelanggan Global</h4>
                <p className="text-blue-700 text-sm">Akses data pelanggan dari semua cabang</p>
              </div>
            </div>
            <p className="text-blue-800 text-sm leading-relaxed">
              Anda dapat melihat data pelanggan dari <strong>semua cabang yang ada</strong> dalam satu tempat. 
              Sistem ini memungkinkan manajemen pelanggan yang terpusat dan efisien.
            </p>
          </div>

          {/* Search & Filter Features */}
          <div className="space-y-4">
            <h4 className="font-bold text-gray-800 text-lg">Fitur Pencarian & Filter</h4>
            
            {/* Search */}
            <div className="bg-green-50 rounded-lg p-4 border border-green-200">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                  <span className="text-white text-sm">🔍</span>
                </div>
                <h5 className="font-semibold text-green-800">Pencarian Pelanggan</h5>
              </div>
              <p className="text-green-700 text-sm">
                Gunakan fitur search untuk mencari pelanggan berdasarkan nama atau nomor telepon. 
                Pencarian akan mencari di semua cabang sekaligus.
              </p>
            </div>

            {/* Branch Filter */}
            <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center">
                  <span className="text-white text-sm">🏢</span>
                </div>
                <h5 className="font-semibold text-purple-800">Filter Cabang</h5>
              </div>
              <p className="text-purple-700 text-sm">
                Pilih cabang tertentu untuk melihat pelanggan dari cabang tersebut saja. 
                Atau pilih "Semua Outlet" untuk melihat semua pelanggan.
              </p>
            </div>

            {/* Membership Tabs */}
            <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
                  <span className="text-white text-sm">👑</span>
                </div>
                <h5 className="font-semibold text-orange-800">Tab Membership</h5>
              </div>
              <p className="text-orange-700 text-sm">
                Gunakan tab "Semua", "Member", atau "Non-Member" untuk memfilter pelanggan berdasarkan status membership mereka.
              </p>
            </div>
          </div>

          {/* Customer Creation */}
          <div className="space-y-4">
            <h4 className="font-bold text-gray-800 text-lg">Tambah Pelanggan</h4>
            
            {/* Branch Selection */}
            <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 bg-yellow-500 rounded-lg flex items-center justify-center">
                  <span className="text-white text-sm">➕</span>
                </div>
                <h5 className="font-semibold text-yellow-800">Pilih Outlet</h5>
              </div>
              <p className="text-yellow-700 text-sm">
                Saat menambah pelanggan baru, Anda dapat memilih outlet mana yang akan menjadi "rumah" pelanggan tersebut.
              </p>
            </div>

            {/* Google Maps Link */}
            <div className="bg-cyan-50 rounded-lg p-4 border border-cyan-200">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 bg-cyan-500 rounded-lg flex items-center justify-center">
                  <span className="text-white text-sm">🗺️</span>
                </div>
                <h5 className="font-semibold text-cyan-800">Link Google Maps</h5>
              </div>
              <p className="text-cyan-700 text-sm">
                Tambahkan link Google Maps untuk mempermudah kurir dalam mencari alamat pelanggan. 
                Link ini akan membantu navigasi yang lebih akurat.
              </p>
            </div>
          </div>

          {/* Order Integration */}
          <div className="space-y-4">
            <h4 className="font-bold text-gray-800 text-lg">Integrasi dengan Order</h4>
            
            {/* Global Search */}
            <div className="bg-indigo-50 rounded-lg p-4 border border-indigo-200">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center">
                  <span className="text-white text-sm">🛒</span>
                </div>
                <h5 className="font-semibold text-indigo-800">Pencarian Global</h5>
              </div>
              <p className="text-indigo-700 text-sm">
                Ketika admin cabang tertentu membuat order, sistem akan mencari <strong>semua customer di bisnis Anda</strong>, 
                bukan hanya customer dari cabang tersebut. Ini memudahkan cross-selling antar cabang.
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
                  <li>• Gunakan pencarian untuk menemukan pelanggan dengan cepat</li>
                  <li>• Filter berdasarkan cabang untuk fokus pada area tertentu</li>
                  <li>• Tambahkan link Google Maps untuk alamat yang sulit ditemukan</li>
                  <li>• Manfaatkan pencarian global saat membuat order</li>
                  <li>• Update data pelanggan secara berkala untuk akurasi</li>
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

export default CustomerExplanationModal;
