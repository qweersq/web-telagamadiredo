import { X, ClipboardList, Package, Eye, CreditCard, Printer, Camera, History, Save, Edit3 } from 'lucide-react';

const OrderDetailExplanationModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const handleClose = () => {
    localStorage.setItem('order_detail_explanation_seen', 'true');
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
              <div className="w-10 h-10 bg-telaga-100 rounded-xl flex items-center justify-center">
                <ClipboardList className="w-5 h-5 text-telaga-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 font-montserrat">
                  Detail Pesanan
                </h2>
                <p className="text-sm text-gray-600 font-montserrat">
                  Kelola pesanan lebih lengkap
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
            {/* 4 Step Wizard */}
            <div className="bg-gradient-to-r from-telaga-50 to-senja-50 rounded-xl p-4 border border-telaga-200">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-telaga-500 rounded-lg flex items-center justify-center flex-shrink-0">
                  <ClipboardList className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-telaga-900 mb-1 text-sm font-montserrat">Proses 4 Langkah Detail</h3>
                  <p className="text-xs text-telaga-800 mb-2 font-montserrat">
                    Lebih lengkap dan terstruktur:
                  </p>
                  <div className="space-y-2">
                    <div className="bg-white rounded-lg p-2">
                      <p className="text-xs text-gray-700 font-montserrat">
                        <strong>1️⃣ Customer & Info:</strong> Pilih customer, set tanggal masuk, qty, jenis pelayanan (pickup/datang)
                      </p>
                    </div>
                    <div className="bg-white rounded-lg p-2">
                      <p className="text-xs text-gray-700 font-montserrat">
                        <strong>2️⃣ Layanan & Item:</strong> Tambah layanan, kelola item detail (foto, brand, tipe, material, parfum, notes)
                      </p>
                    </div>
                    <div className="bg-white rounded-lg p-2">
                      <p className="text-xs text-gray-700 font-montserrat">
                        <strong>3️⃣ Review:</strong> Cek semua data sebelum lanjut ke pembayaran
                      </p>
                    </div>
                    <div className="bg-white rounded-lg p-2">
                      <p className="text-xs text-gray-700 font-montserrat">
                        <strong>4️⃣ Pembayaran:</strong> Input payment, multi-method, lihat riwayat pembayaran
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Item Management - FITUR UTAMA */}
            <div className="bg-green-50 rounded-xl p-4 border-2 border-green-300">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Package className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-green-900 mb-1 text-sm font-montserrat">⭐ Kelola Item Detail (Fitur Utama)</h3>
                  <p className="text-xs text-green-800 mb-2 font-montserrat">
                    Kontrol penuh untuk setiap barang customer:
                  </p>
                  <div className="space-y-2">
                    <div className="bg-white rounded-lg p-2 border border-green-200">
                      <p className="text-xs text-gray-700 font-montserrat">
                        <strong>📸 Upload Foto:</strong> Foto sepatu/barang sebelum. Bisa multiple foto per item. Untuk foto sesudah bisa di upload di peran QC (Quality Control).
                      </p>
                    </div>
                    <div className="bg-white rounded-lg p-2 border border-green-200">
                      <p className="text-xs text-gray-700 font-montserrat">
                        <strong>📝 Data Lengkap:</strong> Input nama item, brand, tipe, material, warna, ukuran, parfum yang digunakan, dan catatan khusus.
                      </p>
                    </div>
                    <div className="bg-white rounded-lg p-2 border border-green-200">
                      <p className="text-xs text-gray-700 font-montserrat">
                        <strong>✏️ Edit Kapan Saja:</strong> Ubah data item, tambah foto, update notes bahkan setelah order dibuat (selama belum selesai).
                      </p>
                    </div>
                    <div className="bg-white rounded-lg p-2 border border-green-200">
                      <p className="text-xs text-gray-700 font-montserrat">
                        <strong>🔄 Auto-Save:</strong> Setiap perubahan data item langsung tersimpan otomatis ke server.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Status Tracking */}
            <div className="bg-purple-50 rounded-xl p-4 border border-purple-200">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center flex-shrink-0">
                  <History className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-purple-900 mb-1 text-sm font-montserrat">Tracking Status Per Item</h3>
                  <p className="text-xs text-purple-800 mb-2 font-montserrat">
                    Setiap item punya:
                  </p>
                  <ul className="text-xs text-purple-800 space-y-1 font-montserrat">
                    <li>• <strong>Status Badge:</strong> Antrian → Dikerjakan → Pengeringan → Siap Diambil → Selesai</li>
                    <li>• <strong>Riwayat Status:</strong> Klik icon <strong>"Info"</strong> untuk lihat timeline lengkap perubahan status item</li>
                    <li>• <strong>Siapa yang Kerjakan:</strong> Tercatat teknisi yang handle item tersebut</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Payment & History */}
            <div className="bg-orange-50 rounded-xl p-4 border border-orange-200">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center flex-shrink-0">
                  <CreditCard className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-orange-900 mb-1 text-sm font-montserrat">Pembayaran & Riwayat</h3>
                  <p className="text-xs text-orange-800 mb-2 font-montserrat">
                    Sistem pembayaran lengkap:
                  </p>
                  <div className="space-y-2">
                    <div className="bg-white rounded-lg p-2">
                      <p className="text-xs text-gray-700 font-montserrat">
                        <strong>💳 Multi-Payment:</strong> Terima payment kombinasi (Cash + Transfer, QRIS + Cash, dll)
                      </p>
                    </div>
                    <div className="bg-white rounded-lg p-2">
                      <p className="text-xs text-gray-700 font-montserrat">
                        <strong>📊 Riwayat Pembayaran:</strong> Semua transaksi tercatat lengkap (tanggal, metode, jumlah)
                      </p>
                    </div>
                    <div className="bg-white rounded-lg p-2">
                      <p className="text-xs text-gray-700 font-montserrat">
                        <strong>💰 DP (Uang Muka):</strong> Support pembayaran bertahap, sisanya tercatat otomatis
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Print Features */}
            <div className="bg-telaga-50 rounded-xl p-4 border-2 border-telaga-300">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-telaga-500 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Printer className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-telaga-900 mb-1 text-sm font-montserrat">⭐ Fitur Print Lengkap</h3>
                  <p className="text-xs text-telaga-800 mb-2 font-montserrat">
                    Klik icon <strong>"Print"</strong> di header untuk akses:
                  </p>
                  <div className="space-y-2">
                    <div className="bg-white rounded-lg p-2 border border-telaga-200">
                      <p className="text-xs text-gray-700 font-montserrat">
                        <strong>🧾 Print Struk/Invoice:</strong> Cetak nota untuk customer dengan detail lengkap
                      </p>
                    </div>
                    <div className="bg-white rounded-lg p-2 border border-telaga-200">
                      <p className="text-xs text-gray-700 font-montserrat">
                        <strong>🏷️ Print Tag:</strong> Cetak label/tag untuk ditempel di sepatu customer (tracking fisik)
                      </p>
                    </div>
                    <div className="bg-white rounded-lg p-2 border border-telaga-200">
                      <p className="text-xs text-gray-700 font-montserrat">
                        <strong>👁️ Preview Invoice:</strong> Lihat preview invoice sebelum print atau kirim
                      </p>
                    </div>
                    <div className="bg-white rounded-lg p-2 border border-telaga-200">
                      <p className="text-xs text-gray-700 font-montserrat">
                        <strong>📱 Kirim Pesan:</strong> Format pesan siap kirim ke customer via WhatsApp (invoice digital + link tracking)
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Delete Order */}
            <div className="bg-red-50 rounded-xl p-4 border border-red-200">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-red-500 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-xs font-bold">🗑️</span>
                </div>
                <div>
                  <h3 className="font-bold text-red-900 mb-1 text-sm font-montserrat">Hapus Order</h3>
                  <p className="text-xs text-red-800 font-montserrat">
                    Klik icon <strong>"Sampah"</strong> di pojok kanan atas header untuk hapus order. Fitur ini akan menghapus order beserta semua data terkait (item, pembayaran, riwayat). <strong className="text-red-700">⚠️ Hati-hati: Tindakan tidak bisa dibatalkan dan akan mempengaruhi laporan keuangan.</strong>
                  </p>
                </div>
              </div>
            </div>

            {/* Edit Mode vs New */}
            <div className="bg-yellow-50 rounded-xl p-4 border border-yellow-200">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-yellow-500 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Edit3 className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-yellow-900 mb-1 text-sm font-montserrat">Edit Order Existing</h3>
                  <p className="text-xs text-yellow-800 mb-2 font-montserrat">
                    Halaman ini juga bisa untuk <strong>edit order yang sudah ada</strong>:
                  </p>
                  <ul className="text-xs text-yellow-800 space-y-1 font-montserrat">
                    <li>• <strong>Order Belum Lunas:</strong> Bisa edit layanan, item, dan payment</li>
                    <li>• <strong>Order Sudah Lunas:</strong> Tidak bisa ubah layanan, tapi item masih bisa edit (foto, data, notes)</li>
                    <li>• <strong>Validasi Ketat:</strong> Sistem cegah perubahan yang bisa rusak data financial</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Review Step */}
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-gray-700 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Eye className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 mb-1 text-sm font-montserrat">Review Sebelum Simpan</h3>
                  <p className="text-xs text-gray-700 font-montserrat">
                    <strong>Step 3</strong> adalah review final sebelum payment. Cek semua data customer, layanan, item, foto sudah benar. Ini mencegah kesalahan sebelum order disimpan.
                  </p>
                </div>
              </div>
            </div>

            {/* Validation System */}
            <div className="bg-red-50 rounded-xl p-4 border border-red-200">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-red-500 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-xs font-bold">!</span>
                </div>
                <div>
                  <h3 className="font-bold text-red-900 mb-1 text-sm font-montserrat">Validasi Real-Time</h3>
                  <p className="text-xs text-red-800 mb-2 font-montserrat">
                    Sistem punya <strong>floating icon validasi</strong> di pojok kanan bawah:
                  </p>
                  <ul className="text-xs text-red-800 space-y-1 font-montserrat">
                    <li>• <strong>Badge merah:</strong> Ada error yang harus diperbaiki</li>
                    <li>• <strong>Badge kuning:</strong> Ada warning (boleh lanjut tapi perlu perhatian)</li>
                    <li>• Klik icon untuk lihat detail error/warning per step</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Tips */}
            <div className="bg-gradient-to-r from-senja-50 to-telaga-50 rounded-xl p-4 border-2 border-senja-200">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-xs font-bold">💡</span>
                </div>
                <div>
                  <h3 className="font-bold text-indigo-900 mb-1 text-sm font-montserrat">Kapan Pakai Order Detail?</h3>
                  <ul className="text-xs text-indigo-800 space-y-1 font-montserrat">
                    <li>• Order kompleks dengan <strong>banyak item</strong> yang perlu foto & data detail</li>
                    <li>• Perlu <strong>tracking status</strong> per item untuk koordinasi teknisi</li>
                    <li>• Customer minta <strong>dokumentasi lengkap</strong> (foto sebelum, notes khusus)</li>
                    <li>• <strong>Edit order existing</strong> yang sudah dibuat sebelumnya</li>
                    <li>• Butuh <strong>print tag</strong> untuk label fisik sepatu</li>
                  </ul>
                  {/* <div className="mt-2 p-2 bg-white rounded-lg border border-senja-200">
                    <p className="text-xs text-gray-700 font-montserrat">
                      <strong>💡 Tips:</strong> Untuk order cepat tanpa perlu detail item, gunakan <strong>"Tambah Pesanan"</strong> (QuickOrder) saja.
                    </p>
                  </div> */}
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 rounded-b-2xl flex-shrink-0">
          <button
            onClick={handleClose}
            className="w-full py-3 bg-telaga-600 hover:bg-telaga-700 text-white rounded-xl font-semibold text-sm transition-colors font-montserrat"
          >
            Mengerti, Mulai Kelola Order Detail
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrderDetailExplanationModal;

