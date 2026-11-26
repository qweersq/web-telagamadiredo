import React from 'react';
import AnimatedButton from '../Design/AnimatedButton';

const MembershipExplanationModal = ({ isOpen, onClose, onConfirm }) => {
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
              Penjelasan Membership
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Pelajari cara menggunakan fitur membership
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
          {/* Apa itu Membership */}
          <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
              </div>
              <div>
                <h4 className="font-bold text-blue-800 text-lg">Apa itu Membership?</h4>
                <p className="text-blue-700 text-sm">Program khusus untuk pelanggan setia</p>
              </div>
            </div>
            <p className="text-blue-800 text-sm leading-relaxed">
              Membership adalah program khusus untuk pelanggan setia Anda. Pelanggan yang punya membership akan mendapat <strong>diskon khusus</strong> dan <strong>status member</strong> di sistem. Membership yang Anda buat akan <strong>otomatis tersedia di semua outlet</strong> Anda.
            </p>
          </div>

          {/* Dua Cara Mendapatkan Membership */}
          <div className="space-y-4">
            <h4 className="font-bold text-gray-800 text-lg">Dua Cara Mendapatkan Membership</h4>
            
            {/* Bayar Langsung */}
            <div className="bg-green-50 rounded-lg p-4 border border-green-200">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                  <span className="text-white text-sm">💳</span>
                </div>
                <h5 className="font-semibold text-green-800">💳 Bayar Langsung (Shortcut)</h5>
              </div>
              <p className="text-green-700 text-sm mb-2">
                Pelanggan bisa langsung bayar untuk dapat membership tanpa menunggu. Cocok untuk pelanggan yang ingin langsung dapat keuntungan membership. Setelah durasi habis, tier akan kembali ke level sesuai lifetime points mereka.
              </p>
              <p className="text-green-600 text-xs italic">
                💡 Aktif jika Anda set Harga {'>'} 0
              </p>
            </div>

            {/* Via Lifetime Points */}
            <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center">
                  <span className="text-white text-sm">⭐</span>
                </div>
                <h5 className="font-semibold text-purple-800">⭐ Via Lifetime Points (Otomatis)</h5>
              </div>
              <p className="text-purple-700 text-sm mb-2">
                Pelanggan yang rajin belanja akan otomatis dapat membership saat lifetime points mereka cukup. Gratis, tidak perlu bayar. Sistem akan otomatis upgrade tier mereka.
              </p>
              <p className="text-purple-600 text-xs italic">
                💡 Aktif jika Anda set Minimum Poin
              </p>
            </div>

            {/* Bisa Keduanya */}
            <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 bg-yellow-500 rounded-lg flex items-center justify-center">
                  <span className="text-white text-sm">⚡</span>
                </div>
                <h5 className="font-semibold text-yellow-800">⚡ Bisa Keduanya</h5>
              </div>
              <p className="text-yellow-700 text-sm mb-2">
                Anda bisa set membership yang bisa didapat dengan dua cara. Pelanggan bisa pilih: bayar langsung untuk dapat sekarang, atau menunggu poin cukup untuk dapat gratis. Jika pelanggan bayar langsung, tier mereka tidak akan auto-upgrade sampai paid membership expire.
              </p>
              <p className="text-yellow-600 text-xs italic">
                💡 Aktif jika Anda set Harga {'>'} 0 DAN Minimum Poin
              </p>
            </div>
          </div>

          {/* Manfaat Membership */}
          <div className="space-y-4">
            <h4 className="font-bold text-gray-800 text-lg">Manfaat Membership</h4>
            
            {/* Diskon Khusus */}
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                  <span className="text-white text-sm">%</span>
                </div>
                <h5 className="font-semibold text-blue-800">Diskon Khusus</h5>
              </div>
              <p className="text-blue-700 text-sm">
                Pelanggan dengan membership akan mendapat diskon sesuai persentase yang Anda set. Diskon akan otomatis terhitung saat checkout.
              </p>
            </div>

            {/* Status Khusus */}
            <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center">
                  <span className="text-white text-sm">✓</span>
                </div>
                <h5 className="font-semibold text-purple-800">Status Khusus</h5>
              </div>
              <p className="text-purple-700 text-sm">
                Pelanggan dengan membership akan terlihat sebagai member di sistem. Membantu Anda membedakan pelanggan setia dengan pelanggan biasa.
              </p>
            </div>

            {/* Tracking Durasi */}
            <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center">
                  <span className="text-white text-sm">📅</span>
                </div>
                <h5 className="font-semibold text-purple-800">Tracking Durasi</h5>
              </div>
              <p className="text-purple-700 text-sm">
                Sistem akan otomatis tracking sisa hari membership pelanggan. Membantu Anda tahu kapan membership akan berakhir dan bisa follow-up untuk perpanjangan.
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
                <h5 className="font-semibold text-yellow-800 mb-2">Tips untuk Owner</h5>
                <ul className="text-yellow-700 text-sm space-y-1">
                  <li>• Gunakan nama membership yang mudah diingat (PREMIUM, VIP, GOLD)</li>
                  <li>• Set harga yang wajar jika ingin pakai "Bayar Langsung"</li>
                  <li>• Set minimum poin dari kecil ke besar (0, 1000, 5000, 10000) untuk tier</li>
                  <li>• Set durasi sesuai kebutuhan (30 hari, 90 hari, 365 hari)</li>
                  <li>• Pilih cara mendapatkan: hanya bayar, hanya poin, atau keduanya</li>
                  <li>• Pantau sisa hari membership pelanggan untuk follow-up</li>
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

export default MembershipExplanationModal;
