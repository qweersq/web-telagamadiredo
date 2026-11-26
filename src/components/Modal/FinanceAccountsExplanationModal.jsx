import React from 'react';
import { Wallet, CreditCard, Banknote, QrCode, Plus, Edit, MapPin, ArrowUp, ArrowDown } from 'lucide-react';
import AnimatedButton from '../Design/AnimatedButton';

const FinanceAccountsExplanationModal = ({ isOpen, onClose, onConfirm }) => {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-6 sm:p-8 font-montserrat"
      style={{ 
        paddingTop: 'max(2rem, env(safe-area-inset-top))',
        paddingBottom: 'max(2rem, env(safe-area-inset-bottom))',
        paddingLeft: 'max(1.5rem, env(safe-area-inset-left))',
        paddingRight: 'max(1.5rem, env(safe-area-inset-right))'
      }}
    >
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full flex flex-col max-h-[85vh]">
        {/* Modal Header - Fixed */}
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 text-white flex-shrink-0 rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
              <Wallet className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold font-montserrat">Akun & Pembayaran</h2>
              <p className="text-blue-100 text-sm font-montserrat">Panduan pengelolaan akun keuangan dan saldo</p>
            </div>
          </div>
        </div>

        {/* Modal Content - Scrollable */}
        <div 
          className="p-6 overflow-y-auto flex-1"
          style={{ 
            WebkitOverflowScrolling: 'touch',
            overscrollBehavior: 'contain'
          }}
        >
          <div className="space-y-6">
            {/* Penjelasan Utama */}
            <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Wallet className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-blue-800 mb-2 font-montserrat">Apa itu Akun & Pembayaran?</h3>
                  <p className="text-blue-700 text-sm leading-relaxed font-montserrat">
                    Akun & Pembayaran adalah tempat untuk mengelola berbagai metode pembayaran dan saldo keuangan. 
                    Setiap akun memiliki saldo yang akan menyesuaikan otomatis setiap kali ada transaksi masuk atau keluar. 
                    Akun ini akan dipilih saat melakukan pembayaran untuk memudahkan pelacakan keuangan.
                  </p>
                </div>
              </div>
            </div>

            {/* Jenis Akun */}
            <div>
              <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2 font-montserrat">
                <MapPin className="w-5 h-5 text-purple-500" />
                Jenis Akun Keuangan
              </h3>
              <div className="grid gap-3">
                <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
                  <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-green-600 text-xs font-bold">🌐</span>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-800 text-sm font-montserrat">Akun Global</h4>
                    <p className="text-gray-600 text-xs font-montserrat">Dapat diakses di semua cabang, cocok untuk pembayaran yang digunakan secara umum seperti QRIS, Transfer Bank</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-blue-600 text-xs font-bold">🏪</span>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-800 text-sm font-montserrat">Akun Spesifik Cabang</h4>
                    <p className="text-gray-600 text-xs font-montserrat">Hanya bisa diakses di cabang tertentu, cocok untuk Cash Tunai (CAB1, CAB2) untuk memantau kondisi uang di laci kasir</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Fitur Utama */}
            <div>
              <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2 font-montserrat">
                <Plus className="w-5 h-5 text-blue-500" />
                Fitur Akun & Pembayaran
              </h3>
              <div className="grid gap-3">
                <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-blue-600 text-xs font-bold">1</span>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-800 text-sm font-montserrat">Saldo Otomatis</h4>
                    <p className="text-gray-600 text-xs font-montserrat">Saldo akan menyesuaikan otomatis setiap kali ada transaksi masuk atau keluar</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-blue-600 text-xs font-bold">2</span>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-800 text-sm font-montserrat">Pilihan Pembayaran</h4>
                    <p className="text-gray-600 text-xs font-montserrat">Akun ini akan muncul sebagai pilihan saat melakukan pembayaran di transaksi</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-blue-600 text-xs font-bold">3</span>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-800 text-sm font-montserrat">Monitoring Real-time</h4>
                    <p className="text-gray-600 text-xs font-montserrat">Pantau kondisi keuangan setiap cabang secara real-time dan terpisah</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-blue-600 text-xs font-bold">4</span>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-800 text-sm font-montserrat">Status Aktif/Nonaktif</h4>
                    <p className="text-gray-600 text-xs font-montserrat">Kontrol ketersediaan akun untuk transaksi dengan mengaktifkan atau menonaktifkan</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Cara Penggunaan */}
            <div>
              <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2 font-montserrat">
                <Edit className="w-5 h-5 text-purple-500" />
                Cara Penggunaan
              </h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Plus className="w-3 h-3 text-purple-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-800 text-sm font-montserrat">1. Tambah Akun Baru</h4>
                    <p className="text-gray-600 text-xs font-montserrat">Klik "Tambah Akun" untuk membuat akun pembayaran baru dengan saldo awal</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <MapPin className="w-3 h-3 text-purple-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-800 text-sm font-montserrat">2. Pilih Jenis Akun</h4>
                    <p className="text-gray-600 text-xs font-montserrat">Tentukan apakah akun global (semua cabang) atau spesifik cabang tertentu</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Edit className="w-3 h-3 text-purple-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-800 text-sm font-montserrat">3. Kelola Saldo</h4>
                    <p className="text-gray-600 text-xs font-montserrat">Set saldo awal dan pantau perubahan saldo secara real-time</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-purple-600 text-xs font-bold">💳</span>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-800 text-sm font-montserrat">4. Gunakan di Transaksi</h4>
                    <p className="text-gray-600 text-xs font-montserrat">Akun akan muncul sebagai pilihan pembayaran saat membuat transaksi</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Contoh Akun */}
            <div className="bg-yellow-50 rounded-xl p-4 border border-yellow-200">
              <h3 className="font-semibold text-yellow-800 mb-2 flex items-center gap-2 font-montserrat">
                <span className="text-lg">💡</span>
                Contoh Akun & Pembayaran
              </h3>
              <div className="text-yellow-700 text-sm space-y-2 font-montserrat">
                <p><strong>Akun Global:</strong> QRIS, Transfer Bank, E-Wallet (Dana, OVO, GoPay)</p>
                <p><strong>Akun Spesifik Cabang:</strong> Cash Tunai CAB1, Cash Tunai CAB2, Kas Kecil CAB1</p>
                <p><strong>Tips:</strong> Buat akun terpisah untuk setiap cabang agar mudah memantau kondisi keuangan</p>
              </div>
            </div>

            {/* Manfaat */}
            <div className="bg-green-50 rounded-xl p-4 border border-green-200">
              <h3 className="font-semibold text-green-800 mb-2 flex items-center gap-2 font-montserrat">
                <span className="text-lg">📊</span>
                Manfaat Akun & Pembayaran
              </h3>
              <ul className="text-green-700 text-sm space-y-1 font-montserrat">
                <li>• Memudahkan pelacakan saldo setiap metode pembayaran</li>
                <li>• Monitoring kondisi keuangan per cabang secara terpisah</li>
                <li>• Otomatisasi perhitungan saldo saat transaksi</li>
                <li>• Kontrol akses pembayaran per cabang</li>
                <li>• Laporan keuangan yang lebih akurat dan detail</li>
                <li>• Memudahkan audit dan rekonsiliasi keuangan</li>
              </ul>
            </div>

            {/* Penjelasan Saldo */}
            <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
              <h3 className="font-semibold text-blue-800 mb-2 flex items-center gap-2 font-montserrat">
                <ArrowUp className="w-5 h-5" />
                <ArrowDown className="w-5 h-5" />
                Sistem Saldo Otomatis
              </h3>
              <div className="text-blue-700 text-sm space-y-2 font-montserrat">
                <p><strong>Uang Masuk:</strong> Saldo akan bertambah otomatis saat ada transaksi masuk</p>
                <p><strong>Uang Keluar:</strong> Saldo akan berkurang otomatis saat ada transaksi keluar</p>
                <p><strong>Real-time:</strong> Perubahan saldo langsung terlihat tanpa perlu refresh</p>
                <p><strong>Akurat:</strong> Setiap transaksi tercatat dengan detail untuk audit</p>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-gray-50 p-6 border-t border-gray-200">
          <div className="flex gap-3">
            <AnimatedButton
              onClick={onClose}
              className="flex-1 py-3 bg-gray-500 text-white rounded-xl font-semibold text-sm hover:bg-gray-600 transition-all duration-200 font-montserrat"
            >
              Tutup
            </AnimatedButton>
            <AnimatedButton
              onClick={onConfirm}
              className="flex-1 py-3 bg-blue-500 text-white rounded-xl font-semibold text-sm hover:bg-blue-600 transition-all duration-200 font-montserrat"
            >
              Mulai Kelola Akun
            </AnimatedButton>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FinanceAccountsExplanationModal;
