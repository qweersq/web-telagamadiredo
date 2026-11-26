import React from 'react';
import { Tag, Plus, Edit, Lock, ArrowUp, ArrowDown, ArrowRightLeft } from 'lucide-react';
import AnimatedButton from '../Design/AnimatedButton';

const FinanceCategoriesExplanationModal = ({ isOpen, onClose, onConfirm }) => {
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
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full flex flex-col max-h-[85vh]">
        {/* Modal Header - Fixed */}
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 text-white flex-shrink-0 rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
              <Tag className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Kategori Keuangan</h2>
              <p className="text-blue-100 text-sm">Panduan pengelolaan kategori keuangan</p>
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
                  <Tag className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-blue-800 mb-2">Apa itu Kategori Keuangan?</h3>
                  <p className="text-blue-700 text-sm leading-relaxed">
                    Kategori keuangan adalah pengelompokan transaksi keuangan untuk memudahkan pelacakan dan analisis. 
                    Sistem sudah menyediakan kategori default yang umum digunakan, dan Anda bisa menambahkan kategori 
                    yang lebih spesifik sesuai kebutuhan bisnis Anda.
                  </p>
                </div>
              </div>
            </div>

            {/* Kategori Default */}
            <div>
              <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Lock className="w-5 h-5 text-gray-500" />
                Kategori Default Sistem
              </h3>
              <div className="grid gap-3">
                <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
                  <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <ArrowUp className="w-3 h-3 text-green-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-800 text-sm">Pendapatan</h4>
                    <p className="text-gray-600 text-xs">Kategori untuk semua jenis pemasukan bisnis (penjualan, layanan, dll.)</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3 p-3 bg-red-50 rounded-lg border border-red-200">
                  <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <ArrowDown className="w-3 h-3 text-red-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-800 text-sm">Beban Operasional</h4>
                    <p className="text-gray-600 text-xs">Kategori untuk biaya operasional harian (listrik, air, internet, dll.)</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3 p-3 bg-red-50 rounded-lg border border-red-200">
                  <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <ArrowDown className="w-3 h-3 text-red-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-800 text-sm">Beban Gaji</h4>
                    <p className="text-gray-600 text-xs">Kategori untuk biaya gaji karyawan dan tunjangan</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <ArrowRightLeft className="w-3 h-3 text-gray-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-800 text-sm">Transfer & Penyesuaian</h4>
                    <p className="text-gray-600 text-xs">Kategori neutral untuk transfer antar akun dan penyesuaian saldo</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Fitur Utama */}
            <div>
              <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Plus className="w-5 h-5 text-blue-500" />
                Fitur Kategori Keuangan
              </h3>
              <div className="grid gap-3">
                <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-blue-600 text-xs font-bold">1</span>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-800 text-sm">Kategori Default</h4>
                    <p className="text-gray-600 text-xs">Sistem sudah menyediakan kategori umum yang tidak bisa dihapus atau diedit</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-blue-600 text-xs font-bold">2</span>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-800 text-sm">Kategori Kustom</h4>
                    <p className="text-gray-600 text-xs">Buat kategori tambahan yang lebih spesifik sesuai kebutuhan bisnis Anda</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-blue-600 text-xs font-bold">3</span>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-800 text-sm">Tipe Kategori</h4>
                    <p className="text-gray-600 text-xs">Pilih tipe Pemasukan (hijau) atau Pengeluaran (merah) untuk setiap kategori</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-blue-600 text-xs font-bold">4</span>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-800 text-sm">Deskripsi</h4>
                    <p className="text-gray-600 text-xs">Tambahkan deskripsi untuk menjelaskan penggunaan kategori tersebut</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-blue-600 text-xs font-bold">5</span>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-800 text-sm">Kategori Neutral</h4>
                    <p className="text-gray-600 text-xs">Kategori khusus untuk transfer antar akun dan penyesuaian saldo yang tidak mempengaruhi laba rugi</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Cara Penggunaan */}
            <div>
              <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Edit className="w-5 h-5 text-purple-500" />
                Cara Penggunaan
              </h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Plus className="w-3 h-3 text-purple-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-800 text-sm">1. Tambah Kategori Baru</h4>
                    <p className="text-gray-600 text-xs">Klik tombol "+" untuk membuat kategori kustom yang lebih spesifik</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Edit className="w-3 h-3 text-purple-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-800 text-sm">2. Edit Kategori Kustom</h4>
                    <p className="text-gray-600 text-xs">Klik "Edit" pada kategori yang Anda buat untuk mengubah nama atau deskripsi</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Lock className="w-3 h-3 text-purple-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-800 text-sm">3. Kategori System</h4>
                    <p className="text-gray-600 text-xs">Kategori default tidak bisa diedit atau dihapus, hanya bisa digunakan</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Contoh Kategori */}
            <div className="bg-yellow-50 rounded-xl p-4 border border-yellow-200">
              <h3 className="font-semibold text-yellow-800 mb-2 flex items-center gap-2">
                <span className="text-lg">💡</span>
                Contoh Kategori Kustom
              </h3>
              <div className="text-yellow-700 text-sm space-y-2">
                <p><strong>Pemasukan:</strong> Penjualan Sepatu, Layanan Cuci, Service, Komisi</p>
                <p><strong>Pengeluaran:</strong> Bahan Baku, Transportasi, Marketing, Maintenance</p>
                <p><strong>Neutral:</strong> Transfer Bank ke Kas, Penyesuaian Saldo, Koreksi Jurnal</p>
                <p><strong>Tips:</strong> Buat kategori yang spesifik untuk memudahkan analisis keuangan</p>
              </div>
            </div>

            {/* Manfaat */}
            <div className="bg-green-50 rounded-xl p-4 border border-green-200">
              <h3 className="font-semibold text-green-800 mb-2 flex items-center gap-2">
                <span className="text-lg">📊</span>
                Manfaat Kategori Keuangan
              </h3>
              <ul className="text-green-700 text-sm space-y-1">
                <li>• Memudahkan pelacakan pengeluaran dan pemasukan</li>
                <li>• Membantu analisis keuangan bisnis</li>
                <li>• Meningkatkan akurasi laporan keuangan</li>
                <li>• Memudahkan perencanaan anggaran</li>
                <li>• Membantu identifikasi area yang perlu optimasi</li>
                <li>• Kategori neutral memudahkan transfer dan penyesuaian saldo</li>
              </ul>
            </div>

            {/* Penjelasan Kategori Neutral */}
            <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
              <h3 className="font-semibold text-blue-800 mb-2 flex items-center gap-2">
                <ArrowRightLeft className="w-5 h-5" />
                Kategori Neutral - Transfer & Penyesuaian
              </h3>
              <div className="text-blue-700 text-sm space-y-2">
                <p><strong>Fungsi:</strong> Kategori ini digunakan untuk transaksi yang tidak mempengaruhi laba rugi bisnis</p>
                <p><strong>Contoh Penggunaan:</strong></p>
                <ul className="ml-4 space-y-1">
                  <li>• Transfer uang dari Bank ke Kas</li>
                  <li>• Penyesuaian saldo awal bulan</li>
                  <li>• Koreksi jurnal akuntansi</li>
                  <li>• Transfer antar rekening</li>
                </ul>
                <p><strong>Keuntungan:</strong> Memisahkan transaksi operasional dengan transaksi administratif</p>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-gray-50 p-6 border-t border-gray-200">
          <div className="flex gap-3">
            <AnimatedButton
              onClick={onClose}
              className="flex-1 py-3 bg-gray-500 text-white rounded-xl font-semibold text-sm hover:bg-gray-600 transition-all duration-200"
            >
              Tutup
            </AnimatedButton>
            <AnimatedButton
              onClick={onConfirm}
              className="flex-1 py-3 bg-blue-500 text-white rounded-xl font-semibold text-sm hover:bg-blue-600 transition-all duration-200"
            >
              Mulai Kelola Kategori
            </AnimatedButton>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FinanceCategoriesExplanationModal;
