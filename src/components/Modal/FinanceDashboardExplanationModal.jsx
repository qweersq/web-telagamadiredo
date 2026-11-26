import React from 'react';
import { DollarSign, TrendingUp, TrendingDown, Wallet, ArrowRightLeft, Eye, Filter, Calendar, MapPin, Plus, Minus } from 'lucide-react';
import AnimatedButton from '../Design/AnimatedButton';

const FinanceDashboardExplanationModal = ({ isOpen, onClose, onConfirm }) => {
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
        <div className="bg-gradient-to-r from-green-500 to-green-600 p-6 text-white flex-shrink-0 rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
              <DollarSign className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold font-montserrat">Transaksi Keuangan</h2>
              <p className="text-green-100 text-sm font-montserrat">Panduan lengkap pengelolaan transaksi dan saldo keuangan</p>
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
          {/* Penjelasan Utama */}
          <div className="mb-6">
            <div className="bg-green-50 rounded-xl p-4 border border-green-200">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center flex-shrink-0">
                  <DollarSign className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-green-800 mb-2 font-montserrat">Apa itu Transaksi Keuangan?</h3>
                  <p className="text-green-700 text-sm leading-relaxed font-montserrat">
                    Dashboard Transaksi Keuangan adalah pusat kontrol untuk memantau semua transaksi masuk dan keluar, 
                    mengelola saldo akun keuangan, dan melakukan penyesuaian saldo antar akun. 
                    Di sini Anda dapat melihat ringkasan keuangan real-time dan mengatur transfer antar akun.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Fitur Utama */}
          <div>
            <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2 font-montserrat">
              <Plus className="w-5 h-5 text-blue-500" />
              Fitur Transaksi Keuangan
            </h3>
            <div className="grid gap-3">
              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-blue-600 text-xs font-bold">1</span>
                </div>
                <div>
                  <h4 className="font-medium text-gray-800 text-sm font-montserrat">Pantau Transaksi Real-time</h4>
                  <p className="text-gray-600 text-xs font-montserrat">Lihat semua transaksi masuk dan keluar dengan detail lengkap, filter berdasarkan periode dan cabang</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-blue-600 text-xs font-bold">2</span>
                </div>
                <div>
                  <h4 className="font-medium text-gray-800 text-sm font-montserrat">Saldo Akun Keuangan</h4>
                  <p className="text-gray-600 text-xs font-montserrat">Pantau saldo setiap akun keuangan (QRIS, Bank, Cash) yang menyesuaikan otomatis dengan transaksi</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-blue-600 text-xs font-bold">3</span>
                </div>
                <div>
                  <h4 className="font-medium text-gray-800 text-sm font-montserrat">Transfer Antar Akun</h4>
                  <p className="text-gray-600 text-xs font-montserrat">Pindahkan saldo antar akun keuangan untuk penyesuaian (QRIS → Bank, Cash → Bank, dll)</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-blue-600 text-xs font-bold">4</span>
                </div>
                <div>
                  <h4 className="font-medium text-gray-800 text-sm font-montserrat">Filter & Pencarian</h4>
                  <p className="text-gray-600 text-xs font-montserrat">Cari transaksi spesifik dan filter berdasarkan periode (harian, mingguan, bulanan) dan cabang</p>
                </div>
              </div>
            </div>
          </div>

          {/* Jenis Transaksi */}
          <div className="mt-6">
            <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2 font-montserrat">
              <TrendingUp className="w-5 h-5 text-green-500" />
              Jenis Transaksi
            </h3>
            <div className="grid gap-3">
              <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
                <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <TrendingUp className="w-3 h-3 text-green-600" />
                </div>
                <div>
                  <h4 className="font-medium text-gray-800 text-sm font-montserrat">Transaksi Masuk (Pendapatan)</h4>
                  <p className="text-gray-600 text-xs font-montserrat">Pembayaran dari pelanggan, pendapatan eksternal, dan transfer masuk ke akun</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3 p-3 bg-red-50 rounded-lg border border-red-200">
                <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <TrendingDown className="w-3 h-3 text-red-600" />
                </div>
                <div>
                  <h4 className="font-medium text-gray-800 text-sm font-montserrat">Transaksi Keluar (Pengeluaran)</h4>
                  <p className="text-gray-600 text-xs font-montserrat">Beban operasional, gaji karyawan, pembelian barang, dan transfer keluar dari akun</p>
                </div>
              </div>
            </div>
          </div>

          {/* Cara Penggunaan */}
          <div className="mt-6">
            <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2 font-montserrat">
              <Eye className="w-5 h-5 text-purple-500" />
              Cara Penggunaan
            </h3>
            <div className="grid gap-3">
              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-purple-600 text-xs font-bold">1</span>
                </div>
                <div>
                  <h4 className="font-medium text-gray-800 text-sm font-montserrat">Lihat Ringkasan Keuangan</h4>
                  <p className="text-gray-600 text-xs font-montserrat">Dashboard menampilkan total pendapatan, pengeluaran, dan saldo akun secara real-time</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-purple-600 text-xs font-bold">2</span>
                </div>
                <div>
                  <h4 className="font-medium text-gray-800 text-sm font-montserrat">Filter Data</h4>
                  <p className="text-gray-600 text-xs font-montserrat">Gunakan tombol "Filter Data Finance" untuk memilih periode dan cabang yang ingin dilihat</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-purple-600 text-xs font-bold">3</span>
                </div>
                <div>
                  <h4 className="font-medium text-gray-800 text-sm font-montserrat">Transfer Antar Akun</h4>
                  <p className="text-gray-600 text-xs font-montserrat">Klik tombol "Transfer" di kartu saldo akun untuk memindahkan saldo antar akun keuangan</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-purple-600 text-xs font-bold">4</span>
                </div>
                <div>
                  <h4 className="font-medium text-gray-800 text-sm font-montserrat">Cari Transaksi</h4>
                  <p className="text-gray-600 text-xs font-montserrat">Gunakan search bar untuk mencari transaksi berdasarkan deskripsi, akun, atau jenis transaksi</p>
                </div>
              </div>
            </div>
          </div>

          {/* Contoh Transfer */}
          <div className="mt-6">
            <h3 className="font-semibold text-yellow-800 mb-2 flex items-center gap-2 font-montserrat">
              <span className="text-lg">💡</span>
              Contoh Transfer Antar Akun
            </h3>
            <div className="text-yellow-700 text-sm space-y-2 font-montserrat">
              <p>• <strong>QRIS → Bank:</strong> Pindahkan saldo dari QRIS ke rekening bank untuk keamanan</p>
              <p>• <strong>Cash → Bank:</strong> Setor uang tunai ke rekening bank</p>
              <p>• <strong>Bank A → Bank B:</strong> Transfer antar rekening bank yang berbeda</p>
              <p>• <strong>Penyesuaian Saldo:</strong> Koreksi saldo jika ada ketidaksesuaian</p>
            </div>
          </div>

          {/* Manfaat */}
          <div className="mt-6">
            <h3 className="font-semibold text-green-800 mb-2 flex items-center gap-2 font-montserrat">
              <span className="text-lg">📊</span>
              Manfaat Dashboard Keuangan
            </h3>
            <ul className="text-green-700 text-sm space-y-1 font-montserrat">
              <li>• Kontrol keuangan real-time dan akurat</li>
              <li>• Mudah melakukan penyesuaian saldo antar akun</li>
              <li>• Pantau performa keuangan per periode dan cabang</li>
              <li>• Cari dan filter transaksi dengan mudah</li>
              <li>• Laporan keuangan yang terstruktur dan detail</li>
            </ul>
          </div>

          {/* Penjelasan Transfer */}
          <div className="mt-6">
            <h3 className="font-semibold text-blue-800 mb-2 flex items-center gap-2 font-montserrat">
              <ArrowRightLeft className="w-5 h-5" />
              <Minus className="w-5 h-5" />
              Transfer & Penyesuaian Akun
            </h3>
            <div className="text-blue-700 text-sm space-y-2 font-montserrat">
              <p>
                <strong>Transfer Antar Akun:</strong> Memindahkan saldo dari satu akun ke akun lain tanpa mengubah total kekayaan. 
                Berguna untuk penyesuaian operasional seperti memindahkan uang dari QRIS ke Bank untuk keamanan.
              </p>
              <p>
                <strong>Penyesuaian Saldo:</strong> Koreksi saldo akun jika ada ketidaksesuaian antara catatan sistem dan kondisi riil. 
                Transfer ini membantu menjaga akurasi laporan keuangan.
              </p>
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
              className="flex-1 py-3 bg-green-500 text-white rounded-xl font-semibold text-sm hover:bg-green-600 transition-all duration-200 font-montserrat"
            >
              Mulai Kelola Keuangan
            </AnimatedButton>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FinanceDashboardExplanationModal;
