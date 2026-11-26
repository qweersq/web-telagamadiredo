import { X, ShoppingBag, Filter, BarChart3, RefreshCw, FileText, Search } from 'lucide-react';

const OrderExplanationModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const handleClose = () => {
    localStorage.setItem('order_explanation_seen', 'true');
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
                  Dashboard Pesanan
                </h2>
                <p className="text-sm text-gray-600 font-montserrat">
                  Kelola semua pesanan customer dengan mudah
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
            {/* Tambah Pesanan */}
            <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-sm font-bold">➕</span>
                </div>
                <div>
                  <h3 className="font-bold text-blue-900 mb-1 text-sm font-montserrat">Tambah Pesanan Baru</h3>
                  <p className="text-xs text-blue-800 font-montserrat">
                    Klik <strong>"+ Tambah"</strong> untuk buat order baru. Input data customer, pilih layanan, set harga & tanggal selesai.
                  </p>
                </div>
              </div>
            </div>

            {/* Filter */}
            <div className="bg-purple-50 rounded-xl p-4 border border-purple-200">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Filter className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-purple-900 mb-1 text-sm font-montserrat">Filter Pesanan</h3>
                  <p className="text-xs text-purple-800 mb-2 font-montserrat">
                    Klik <strong>"Filter"</strong> untuk cari pesanan spesifik:
                  </p>
                  <ul className="text-xs text-purple-800 space-y-1 font-montserrat">
                    <li>• <strong>Tanggal:</strong> Hari ini, minggu ini, bulan ini, atau custom</li>
                    <li>• <strong>Status Bayar:</strong> Lunas, Belum Bayar, Bayar Sebagian</li>
                    <li>• <strong>Status Kerja:</strong> Menunggu, Dikerjakan, Selesai</li>
                    <li>• <strong>Search:</strong> Cari by nama customer atau nomor invoice</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Statistik */}
            <div className="bg-green-50 rounded-xl p-4 border border-green-200">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center flex-shrink-0">
                  <BarChart3 className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-green-900 mb-1 text-sm font-montserrat">Statistik Dashboard</h3>
                  <p className="text-xs text-green-800 mb-2 font-montserrat">
                    Angka-angka di atas menunjukkan data <strong>sesuai filter yang aktif:</strong>
                  </p>
                  <div className="space-y-2">
                    <div className="bg-white rounded-lg p-2">
                      <p className="text-xs text-gray-700 font-montserrat">
                        <strong>📦 Total Order:</strong> Jumlah pesanan yang masuk
                      </p>
                    </div>
                    <div className="bg-white rounded-lg p-2">
                      <p className="text-xs text-gray-700 font-montserrat">
                        <strong>👕 Total Layanan:</strong> Jumlah treatment (1 order bisa banyak layanan)
                      </p>
                    </div>
                    <div className="bg-white rounded-lg p-2">
                      <p className="text-xs text-gray-700 font-montserrat">
                        <strong>👟 Total Item:</strong> Jumlah sepatu/barang yang dicatat.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Refresh */}
            <div className="bg-orange-50 rounded-xl p-4 border border-orange-200">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center flex-shrink-0">
                  <RefreshCw className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-orange-900 mb-1 text-sm font-montserrat">Refresh Data</h3>
                  <p className="text-xs text-orange-800 font-montserrat">
                    Klik <strong>"Refresh"</strong> untuk update status terbaru dari teknisi/kasir. Gunakan ketika ada perubahan pembayaran atau progress pengerjaan.
                  </p>
                </div>
              </div>
            </div>

            {/* Card Pesanan */}
            <div className="border-t-2 border-gray-200 pt-4">
              <h3 className="font-bold text-gray-900 mb-3 text-sm flex items-center gap-2 font-montserrat">
                <FileText className="w-4 h-4 text-blue-600" />
                List Data Pesanan
              </h3>
              
              <div className="space-y-3">
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-700 mb-2 font-montserrat">
                    Setiap data pesanan menampilkan:
                  </p>
                  <ul className="text-xs text-gray-600 space-y-1 font-montserrat">
                    <li>• Nomor id pesanan & nama customer</li>
                    <li>• Foto sepatu</li>
                    <li>• Total harga & jenis layanan</li>
                    <li>• Tanggal masuk</li>
                  </ul>
                </div>

                <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 bg-blue-500 rounded flex items-center justify-center">
                      <span className="text-white text-xs">ⓘ</span>
                    </div>
                    <h4 className="font-bold text-blue-900 text-xs font-montserrat">Button "Detail"</h4>
                  </div>
                  <p className="text-xs text-blue-800 font-montserrat">
                    Lihat info lengkap, <strong>upload foto sepatu</strong>, update pembayaran, edit data, print invoice
                  </p>
                </div>

                <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 bg-green-500 rounded flex items-center justify-center">
                      <Search className="w-3 h-3 text-white" />
                    </div>
                    <h4 className="font-bold text-green-900 text-xs font-montserrat">Button "Cek Status"</h4>
                  </div>
                  <p className="text-xs text-green-800 font-montserrat">
                    <strong>Tracking cepat progress</strong> tiap item: timeline pengerjaan, ubah status, siapa yang mengerjakan.
                  </p>
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
            Mengerti, Mulai Kelola Pesanan
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrderExplanationModal;

