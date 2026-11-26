import React from 'react';
import { TrendingDown, Plus, Building, DollarSign, Filter, Search, Eye, Edit, Trash2 } from 'lucide-react';
import AnimatedButton from '../Design/AnimatedButton';

const ExpenseExplanationModal = ({ isOpen, onClose, onConfirm }) => {
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
        <div className="bg-gradient-to-r from-red-500 to-red-600 p-6 text-white flex-shrink-0 rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
              <TrendingDown className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold font-montserrat">Manajemen Pengeluaran</h2>
              <p className="text-red-100 text-sm font-montserrat">Panduan pengelolaan pengeluaran bisnis dan dampak pada saldo akun</p>
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
            <div className="bg-red-50 rounded-xl p-4 border border-red-200">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-red-500 rounded-lg flex items-center justify-center flex-shrink-0">
                  <TrendingDown className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-red-800 mb-2 font-montserrat">Apa itu Manajemen Pengeluaran?</h3>
                  <p className="text-red-700 text-sm leading-relaxed font-montserrat">
                    Manajemen Pengeluaran adalah fitur untuk mengelola semua pengeluaran bisnis Anda. 
                    Setiap pengeluaran yang Anda input akan otomatis mengurangi saldo akun pembayaran yang dipilih. 
                    Anda dapat melihat, menambah, mengedit, dan menghapus pengeluaran untuk cabang tertentu.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Fitur Utama */}
          <div>
            <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2 font-montserrat">
              <Plus className="w-5 h-5 text-blue-500" />
              Fitur Manajemen Pengeluaran
            </h3>
            <div className="grid gap-3">
              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-blue-600 text-xs font-bold">1</span>
                </div>
                <div>
                  <h4 className="font-medium text-gray-800 text-sm font-montserrat">Tambah Pengeluaran</h4>
                  <p className="text-gray-600 text-xs font-montserrat">Input pengeluaran baru dengan detail nama, jumlah, deskripsi, dan pilih akun pembayaran</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-blue-600 text-xs font-bold">2</span>
                </div>
                <div>
                  <h4 className="font-medium text-gray-800 text-sm font-montserrat">Filter & Pencarian</h4>
                  <p className="text-gray-600 text-xs font-montserrat">Cari pengeluaran berdasarkan nama, deskripsi, atau cabang. Filter berdasarkan bulan dan tahun</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-blue-600 text-xs font-bold">3</span>
                </div>
                <div>
                  <h4 className="font-medium text-gray-800 text-sm font-montserrat">Kelola Pengeluaran</h4>
                  <p className="text-gray-600 text-xs font-montserrat">Lihat detail, edit, atau hapus pengeluaran yang sudah ada</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-blue-600 text-xs font-bold">4</span>
                </div>
                <div>
                  <h4 className="font-medium text-gray-800 text-sm font-montserrat">Statistik Real-time</h4>
                  <p className="text-gray-600 text-xs font-montserrat">Lihat total pengeluaran dan jumlah transaksi secara real-time</p>
                </div>
              </div>
            </div>
          </div>

          {/* Dampak pada Saldo Akun */}
          <div className="mt-6">
            <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2 font-montserrat">
              <DollarSign className="w-5 h-5 text-green-500" />
              Dampak pada Saldo Akun
            </h3>
            <div className="bg-green-50 rounded-xl p-4 border border-green-200">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center flex-shrink-0">
                  <DollarSign className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h4 className="font-semibold text-green-800 mb-2 font-montserrat">Pengurangan Saldo Otomatis</h4>
                  <p className="text-green-700 text-sm leading-relaxed font-montserrat">
                    Setiap kali Anda menambah pengeluaran, sistem akan otomatis mengurangi saldo akun pembayaran yang dipilih. 
                    Misalnya: Jika Anda memilih "Bank BCA" sebagai akun pembayaran, maka saldo Bank BCA akan berkurang sesuai jumlah pengeluaran.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Cara Penggunaan */}
          <div className="mt-6">
            <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2 font-montserrat">
              <Building className="w-5 h-5 text-purple-500" />
              Cara Penggunaan
            </h3>
            <div className="grid gap-3">
              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-purple-600 text-xs font-bold">1</span>
                </div>
                <div>
                  <h4 className="font-medium text-gray-800 text-sm font-montserrat">Pilih Cabang</h4>
                  <p className="text-gray-600 text-xs font-montserrat">Gunakan filter untuk memilih cabang yang ingin dikelola pengeluarannya</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-purple-600 text-xs font-bold">2</span>
                </div>
                <div>
                  <h4 className="font-medium text-gray-800 text-sm font-montserrat">Tambah Pengeluaran</h4>
                  <p className="text-gray-600 text-xs font-montserrat">Klik "Tambah Pengeluaran" dan isi detail pengeluaran termasuk pilih akun pembayaran</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-purple-600 text-xs font-bold">3</span>
                </div>
                <div>
                  <h4 className="font-medium text-gray-800 text-sm font-montserrat">Monitor Saldo</h4>
                  <p className="text-gray-600 text-xs font-montserrat">Pantau perubahan saldo akun di dashboard keuangan setelah menambah pengeluaran</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-purple-600 text-xs font-bold">4</span>
                </div>
                <div>
                  <h4 className="font-medium text-gray-800 text-sm font-montserrat">Kelola Data</h4>
                  <p className="text-gray-600 text-xs font-montserrat">Gunakan tombol Lihat, Edit, atau Hapus untuk mengelola pengeluaran yang sudah ada</p>
                </div>
              </div>
            </div>
          </div>

          {/* Contoh Penggunaan */}
          <div className="mt-6">
            <h3 className="font-semibold text-yellow-800 mb-2 flex items-center gap-2 font-montserrat">
              <span className="text-lg">💡</span>
              Contoh Penggunaan
            </h3>
            <div className="text-yellow-700 text-sm space-y-2 font-montserrat">
              <p>• <strong>Beli Bahan Baku:</strong> Input pengeluaran "Beli Bahan Baku" sebesar Rp 500.000, pilih akun "Bank BCA" → Saldo Bank BCA berkurang Rp 500.000</p>
              <p>• <strong>Bayar Gaji Karyawan:</strong> Input pengeluaran "Gaji Karyawan" sebesar Rp 2.000.000, pilih akun "Cash Box" → Saldo Cash Box berkurang Rp 2.000.000</p>
              <p>• <strong>Bayar Listrik:</strong> Input pengeluaran "Tagihan Listrik" sebesar Rp 300.000, pilih akun "QRIS" → Saldo QRIS berkurang Rp 300.000</p>
              <p>• <strong>Perbaikan Mesin:</strong> Input pengeluaran "Service Mesin" sebesar Rp 1.500.000, pilih akun "Bank Mandiri" → Saldo Bank Mandiri berkurang Rp 1.500.000</p>
            </div>
          </div>

          {/* Manfaat */}
          <div className="mt-6">
            <h3 className="font-semibold text-green-800 mb-2 flex items-center gap-2 font-montserrat">
              <span className="text-lg">📊</span>
              Manfaat Manajemen Pengeluaran
            </h3>
            <ul className="text-green-700 text-sm space-y-1 font-montserrat">
              <li>• Kontrol pengeluaran bisnis secara real-time</li>
              <li>• Saldo akun terupdate otomatis setiap transaksi</li>
              <li>• Laporan pengeluaran per cabang dan periode</li>
              <li>• Pencarian dan filter pengeluaran yang mudah</li>
              <li>• Transparansi keuangan bisnis yang lebih baik</li>
            </ul>
          </div>

          {/* Tips Penggunaan */}
          <div className="mt-6">
            <h3 className="font-semibold text-blue-800 mb-2 flex items-center gap-2 font-montserrat">
              <span className="text-lg">💡</span>
              Tips Penggunaan
            </h3>
            <div className="text-blue-700 text-sm space-y-2 font-montserrat">
              <p>• <strong>Pilih Akun yang Tepat:</strong> Pastikan memilih akun pembayaran yang sesuai dengan sumber dana pengeluaran</p>
              <p>• <strong>Deskripsi yang Jelas:</strong> Berikan deskripsi yang detail untuk memudahkan pelacakan pengeluaran</p>
              <p>• <strong>Filter Berdasarkan Periode:</strong> Gunakan filter bulan dan tahun untuk melihat pengeluaran periode tertentu</p>
              <p>• <strong>Monitor Saldo:</strong> Selalu periksa saldo akun setelah menambah pengeluaran untuk memastikan akurasi</p>
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
              className="flex-1 py-3 bg-red-500 text-white rounded-xl font-semibold text-sm hover:bg-red-600 transition-all duration-200 font-montserrat"
            >
              Mulai Kelola
            </AnimatedButton>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExpenseExplanationModal;
