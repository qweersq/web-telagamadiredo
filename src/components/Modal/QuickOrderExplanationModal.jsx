import { X, UserPlus, ShoppingBag, CreditCard, Printer, CheckCircle } from 'lucide-react';

const QuickOrderExplanationModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const handleClose = () => {
    localStorage.setItem('quick_order_explanation_seen', 'true');
    onClose();
  };

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
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[85vh]">
        {/* Header - Fixed */}
        <div className="bg-white border-b border-gray-200 px-6 py-4 rounded-t-2xl flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                <ShoppingBag className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 font-montserrat">
                  Tambah Pesanan
                </h2>
                <p className="text-sm text-gray-600 font-montserrat">
                  Proses tambah pesanan dalam 2 langkah mudah
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center hover:bg-gray-200 transition-colors"
            >
              <X className="w-4 h-4 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Content - Scrollable */}
        <div 
          className="px-6 py-6 overflow-y-auto flex-1"
          style={{ 
            WebkitOverflowScrolling: 'touch',
            overscrollBehavior: 'contain'
          }}
        >
          <div className="space-y-5">
            {/* Proses 2 Langkah */}
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-4 border border-blue-200">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-blue-900 mb-1 text-sm font-montserrat">Proses 2 Langkah Sederhana</h3>
                  <p className="text-xs text-blue-800 mb-2 font-montserrat">
                    Tambah pesanan jadi lebih cepat dan terstruktur:
                  </p>
                  <div className="space-y-2">
                    <div className="bg-white rounded-lg p-2">
                      <p className="text-xs text-gray-700 font-montserrat">
                        <strong>1️⃣ Input Data Pesanan:</strong> Pilih customer, set layanan, tentukan jenis pelayanan
                      </p>
                    </div>
                    <div className="bg-white rounded-lg p-2">
                      <p className="text-xs text-gray-700 font-montserrat">
                        <strong>2️⃣ Pembayaran:</strong> Input metode bayar, jumlah uang, otomatis tersimpan di database
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Customer Selection */}
            <div className="bg-green-50 rounded-xl p-4 border border-green-200">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center flex-shrink-0">
                  <UserPlus className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-green-900 mb-1 text-sm font-montserrat">Pilih Customer</h3>
                  <p className="text-xs text-green-800 font-montserrat">
                    Klik <strong>"Pilih Customer"</strong> untuk cari customer yang sudah terdaftar. Jika customer baru, bisa <strong>langsung tambah pelanggan</strong> tanpa keluar dari form pesanan.
                  </p>
                </div>
              </div>
            </div>

            {/* Jenis Pelayanan */}
            <div className="bg-purple-50 rounded-xl p-4 border border-purple-200">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-xs font-bold">🚚</span>
                </div>
                <div>
                  <h3 className="font-bold text-purple-900 mb-1 text-sm font-montserrat">Jenis Pelayanan</h3>
                  <p className="text-xs text-purple-800 mb-2 font-montserrat">
                    Pilih cara customer menyerahkan sepatu:
                  </p>
                  <ul className="text-xs text-purple-800 space-y-1 font-montserrat">
                    <li>• <strong>Datang ke Toko:</strong> Customer datang langsung (default)</li>
                    <li>• <strong>Pickup Service:</strong> Kurir jemput sepatu → bisa set jadwal pickup (tanggal & jam) dan akan tampil di antrian Kurir</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Treatment Selection */}
            <div className="bg-orange-50 rounded-xl p-4 border border-orange-200">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center flex-shrink-0">
                  <ShoppingBag className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-orange-900 mb-1 text-sm font-montserrat">Pilih Layanan</h3>
                  <p className="text-xs text-orange-800 mb-2 font-montserrat">
                    Tambah layanan yang customer pesan:
                  </p>
                  <ul className="text-xs text-orange-800 space-y-1 font-montserrat">
                    <li>• <strong>Multiple layanan</strong> dalam 1 order (Deep Clean, Unyellowing, dll)</li>
                    <li>• Set <strong>qty (jumlah)</strong> per layanan</li>
                    <li>• Bisa tambah <strong>diskon</strong> per layanan</li>
                    <li>• Tentukan <strong>tanggal selesai</strong> per layanan</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Payment System */}
            <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
                  <CreditCard className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-blue-900 mb-1 text-sm font-montserrat">Sistem Pembayaran Fleksibel</h3>
                  <p className="text-xs text-blue-800 mb-2 font-montserrat">
                    Terima pembayaran dengan berbagai cara:
                  </p>
                  <div className="space-y-2">
                    <div className="bg-white rounded-lg p-2">
                      <p className="text-xs text-gray-700 font-montserrat">
                        <strong>💳 Multi-Payment:</strong> Customer bisa bayar pakai kombinasi (Cash + Transfer, QRIS + Cash, dll)
                      </p>
                    </div>
                    <div className="bg-white rounded-lg p-2">
                      <p className="text-xs text-gray-700 font-montserrat">
                        <strong>💰 DP (Uang Muka):</strong> Jika bayar sebagian dari total. Sistem akan kasih warning otomatis dan sisa bayar tercatat di sistem.
                      </p>
                    </div>
                    <div className="bg-white rounded-lg p-2">
                      <p className="text-xs text-gray-700 font-montserrat">
                        <strong>💰 Lunas:</strong> Jika customer membayar sepenuhnya, sistem akan otomatis mencatat pembayaran dan menandakan pesanan lunas.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Auto Print */}
            <div className="bg-yellow-50 rounded-xl p-4 border border-yellow-200">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-yellow-500 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Printer className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-yellow-900 mb-1 text-sm font-montserrat">Print Invoice</h3>
                  <p className="text-xs text-yellow-800 font-montserrat">
                    Setelah pesanan berhasil dibuat, <strong>modal print nota akan langsung muncul</strong>. Klik print untuk cetak struk dan berikan ke customer yang datang ke toko.
                  </p>
                </div>
              </div>
            </div>

            {/* Tips Workflow */}
            <div className="bg-gray-50 rounded-xl p-4 border-2 border-gray-200">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-gray-700 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-xs font-bold">💡</span>
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 mb-1 text-sm font-montserrat">Tips Cepat</h3>
                  <ul className="text-xs text-gray-700 space-y-1 font-montserrat">
                    <li>• Customer baru? <strong>Langsung tambah</strong> tanpa keluar dari form</li>
                    <li>• DP (Uang Muka)% → Sisanya bisa dibayar pas ambil</li>
                    <li>• Pickup service → <strong>Wajib set jadwal</strong> pickup</li>
                    <li>• Setelah submit → <strong>Langsung print</strong> nota untuk customer datang ke toko</li>
                  </ul>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 rounded-b-2xl flex-shrink-0">
          <button
            onClick={handleClose}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-sm transition-colors font-montserrat"
          >
            Mengerti, Mulai Tambah Pesanan
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuickOrderExplanationModal;

