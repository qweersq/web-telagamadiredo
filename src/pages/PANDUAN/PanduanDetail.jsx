import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FaArrowLeft, FaUsers, FaCogs, FaTruck, FaCashRegister, FaBuilding, FaCog, FaWhatsapp, FaPrint, FaChartBar } from 'react-icons/fa';
import AnimatedButton from '../../components/Design/AnimatedButton';

const PanduanDetail = () => {
  const navigate = useNavigate();
  const { categoryId, itemId } = useParams();

  const panduanData = {
    owner: {
      dashboard: {
        title: 'Dashboard Owner',
        description: 'Memahami beranda dan statistik bisnis',
        icon: FaChartBar,
        content: `
          <h3 class="text-lg font-bold mb-4">Dashboard Owner</h3>
          <p class="mb-4">Dashboard owner adalah pusat kontrol untuk mengelola bisnis laundry Anda. Berikut adalah komponen-komponen utama:</p>
          
          <div class="space-y-4">
            <div class="bg-blue-50 p-4 rounded-lg">
              <h4 class="font-semibold text-blue-800 mb-2">📊 Menu Management</h4>
              <p class="text-sm text-blue-700 mb-2">[TAMBAHKAN SS MENU BERANDA OWNER]</p>
              <p class="text-sm text-blue-700 mb-2">Dashboard owner memiliki 10 menu utama untuk mengelola bisnis:</p>
              <ul class="text-sm text-blue-700 space-y-1">
                <li>• <strong>Data Tenant</strong> - Kelola informasi bisnis dan profil perusahaan</li>
                <li>• <strong>Manajemen Cabang</strong> - Kelola cabang-cabang bisnis</li>
                <li>• <strong>Manajemen Karyawan</strong> - Kelola data dan absensi karyawan</li>
                <li>• <strong>Manajemen Treatment</strong> - Kelola layanan cuci dan harga</li>
                <li>• <strong>Manajemen Discount</strong> - Kelola diskon dan promo</li>
                <li>• <strong>Manajemen Customer</strong> - Kelola data customer dan kontak</li>
                <li>• <strong>Manajemen Finance</strong> - Kelola akun keuangan dan transaksi</li>
                <li>• <strong>Manajemen Shift</strong> - Lihat history shift karyawan</li>
                <li>• <strong>Manajemen Printer</strong> - Kelola printer dan koneksi Bluetooth</li>
                <li>• <strong>Pengaturan WhatsApp</strong> - Konfigurasi WhatsApp per cabang</li>
              </ul>
            </div>
            
            <div class="bg-green-50 p-4 rounded-lg">
              <h4 class="font-semibold text-green-800 mb-2">🔍 Cara Mengakses</h4>
              <p class="text-sm text-green-700 mb-2">[TAMBAHKAN SS MENU BERANDA OWNER]</p>
              <ol class="text-sm text-green-700 space-y-1">
                <li>1. Login sebagai Owner (Superadmin)</li>
                <li>2. Otomatis masuk ke Dashboard Owner</li>
                <li>3. Klik menu yang ingin diakses</li>
                <li>4. Setiap menu memiliki fungsi CRUD lengkap</li>
              </ol>
            </div>
            
            <div class="bg-yellow-50 p-4 rounded-lg">
              <h4 class="font-semibold text-yellow-800 mb-2">💡 Tips Penting</h4>
              <ul class="text-sm text-yellow-700 space-y-1">
                <li>• Gunakan "Analisis Kinerja" untuk melihat laporan</li>
                <li>• Setiap perubahan data akan tersimpan otomatis</li>
                <li>• Pastikan data karyawan selalu update</li>
                <li>• Monitor keuangan secara berkala</li>
              </ul>
            </div>
          </div>
        `
      },
      'data-tenant': {
        title: 'Data Tenant',
        description: 'Kelola data tenant dan informasi bisnis',
        icon: FaBuilding,
        content: `
          <h3 class="text-lg font-bold mb-4">Data Tenant</h3>
          <p class="mb-4">Data Tenant adalah informasi dasar bisnis laundry Anda yang akan digunakan di seluruh sistem.</p>
          
          <div class="space-y-4">
            <div class="bg-blue-50 p-4 rounded-lg">
              <h4 class="font-semibold text-blue-800 mb-2">📋 Informasi Tenant</h4>
              <p class="text-sm text-blue-700 mb-2">[TAMBAHKAN SS DATA TENANT]</p>
              <ul class="text-sm text-blue-700 space-y-1">
                <li>• <strong>Nama Bisnis:</strong> Nama resmi perusahaan laundry</li>
                <li>• <strong>Alamat:</strong> Alamat kantor pusat</li>
                <li>• <strong>Nomor Telepon:</strong> Kontak utama bisnis</li>
                <li>• <strong>Email:</strong> Email resmi perusahaan</li>
                <li>• <strong>Logo:</strong> Logo bisnis untuk branding</li>
              </ul>
            </div>
            
            <div class="bg-green-50 p-4 rounded-lg">
              <h4 class="font-semibold text-green-800 mb-2">⚙️ Pengaturan Sistem</h4>
              <ul class="text-sm text-green-700 space-y-1">
                <li>• <strong>Zona Waktu:</strong> Set zona waktu untuk operasional</li>
                <li>• <strong>Mata Uang:</strong> Mata uang yang digunakan</li>
                <li>• <strong>Format Tanggal:</strong> Format tanggal yang ditampilkan</li>
                <li>• <strong>Bahasa:</strong> Bahasa interface sistem</li>
              </ul>
            </div>
            
            <div class="bg-yellow-50 p-4 rounded-lg">
              <h4 class="font-semibold text-yellow-800 mb-2">💡 Tips Penting</h4>
              <ul class="text-sm text-yellow-700 space-y-1">
                <li>• Pastikan data tenant akurat dan terupdate</li>
                <li>• Logo akan muncul di struk dan dokumen</li>
                <li>• Informasi ini akan digunakan untuk branding</li>
                <li>• Update data jika ada perubahan bisnis</li>
              </ul>
            </div>
          </div>
        `
      },
      'manajemen-cabang': {
        title: 'Manajemen Cabang',
        description: 'Kelola cabang-cabang bisnis Anda',
        icon: FaBuilding,
        content: `
          <h3 class="text-lg font-bold mb-4">Manajemen Cabang</h3>
          <p class="mb-4">Manajemen Cabang memungkinkan Anda mengelola semua cabang bisnis laundry Anda.</p>
          
          <div class="space-y-4">
            <div class="bg-blue-50 p-4 rounded-lg">
              <h4 class="font-semibold text-blue-800 mb-2">🏢 Fitur Cabang</h4>
              <p class="text-sm text-blue-700 mb-2">[TAMBAHKAN SS MANAJEMEN CABANG]</p>
              <ul class="text-sm text-blue-700 space-y-1">
                <li>• <strong>Tambah Cabang:</strong> Buat cabang baru dengan informasi lengkap</li>
                <li>• <strong>Edit Cabang:</strong> Update informasi cabang yang sudah ada</li>
                <li>• <strong>Hapus Cabang:</strong> Hapus cabang yang tidak aktif</li>
                <li>• <strong>Status Cabang:</strong> Aktif/Nonaktif cabang</li>
              </ul>
            </div>
            
            <div class="bg-green-50 p-4 rounded-lg">
              <h4 class="font-semibold text-green-800 mb-2">📋 Informasi Cabang</h4>
              <ul class="text-sm text-green-700 space-y-1">
                <li>• <strong>Nama Cabang:</strong> Nama cabang yang mudah dikenali</li>
                <li>• <strong>Alamat:</strong> Alamat lengkap cabang</li>
                <li>• <strong>Nomor Telepon:</strong> Kontak cabang</li>
                <li>• <strong>Manager:</strong> Penanggung jawab cabang</li>
                <li>• <strong>Jam Operasional:</strong> Jam buka dan tutup</li>
              </ul>
            </div>
            
            <div class="bg-yellow-50 p-4 rounded-lg">
              <h4 class="font-semibold text-yellow-800 mb-2">💡 Tips Pengelolaan</h4>
              <ul class="text-sm text-yellow-700 space-y-1">
                <li>• Setiap cabang memiliki data terpisah</li>
                <li>• Karyawan hanya bisa akses cabang mereka</li>
                <li>• Owner bisa akses semua cabang</li>
                <li>• Monitor performa setiap cabang</li>
              </ul>
            </div>
          </div>
        `
      },
      'manajemen-karyawan': {
        title: 'Manajemen Karyawan',
        description: 'Kelola data dan absensi karyawan',
        icon: FaBuilding,
        content: `
          <h3 class="text-lg font-bold mb-4">Manajemen Karyawan</h3>
          <p class="mb-4">Manajemen Karyawan memungkinkan Anda mengelola semua data karyawan dan absensi mereka.</p>
          
          <div class="space-y-4">
            <div class="bg-blue-50 p-4 rounded-lg">
              <h4 class="font-semibold text-blue-800 mb-2">👥 Fitur Karyawan</h4>
              <p class="text-sm text-blue-700 mb-2">[TAMBAHKAN SS MANAJEMEN KARYAWAN]</p>
              <ul class="text-sm text-blue-700 space-y-1">
                <li>• <strong>Tambah Karyawan:</strong> Rekrut karyawan baru</li>
                <li>• <strong>Edit Data:</strong> Update informasi karyawan</li>
                <li>• <strong>Hapus Karyawan:</strong> Hapus karyawan yang keluar</li>
                <li>• <strong>Assign Role:</strong> Tentukan role dan akses</li>
              </ul>
            </div>
            
            <div class="bg-green-50 p-4 rounded-lg">
              <h4 class="font-semibold text-green-800 mb-2">📊 Data Karyawan</h4>
              <ul class="text-sm text-green-700 space-y-1">
                <li>• <strong>Informasi Personal:</strong> Nama, alamat, kontak</li>
                <li>• <strong>Informasi Kerja:</strong> Role, cabang, gaji</li>
                <li>• <strong>Absensi:</strong> History kehadiran dan izin</li>
                <li>• <strong>Performa:</strong> Evaluasi kinerja karyawan</li>
              </ul>
            </div>
            
            <div class="bg-yellow-50 p-4 rounded-lg">
              <h4 class="font-semibold text-yellow-800 mb-2">🔐 Role Management</h4>
              <ul class="text-sm text-yellow-700 space-y-1">
                <li>• <strong>Superadmin:</strong> Owner dengan akses penuh</li>
                <li>• <strong>Admin:</strong> Manager cabang dengan akses terbatas</li>
                <li>• <strong>Employee:</strong> Karyawan operasional</li>
                <li>• <strong>Assign Cabang:</strong> Tentukan cabang kerja karyawan</li>
              </ul>
            </div>
          </div>
        `
      },
      'manajemen-treatment': {
        title: 'Manajemen Treatment',
        description: 'Kelola treatment dan layanan',
        icon: FaBuilding,
        content: `
          <h3 class="text-lg font-bold mb-4">Manajemen Treatment</h3>
          <p class="mb-4">Manajemen Treatment memungkinkan Anda mengelola semua layanan cuci yang ditawarkan.</p>
          
          <div class="space-y-4">
            <div class="bg-blue-50 p-4 rounded-lg">
              <h4 class="font-semibold text-blue-800 mb-2">💊 Fitur Treatment</h4>
              <p class="text-sm text-blue-700 mb-2">[TAMBAHKAN SS MANAJEMEN TREATMENT]</p>
              <ul class="text-sm text-blue-700 space-y-1">
                <li>• <strong>Tambah Treatment:</strong> Buat layanan cuci baru</li>
                <li>• <strong>Edit Treatment:</strong> Update harga dan deskripsi</li>
                <li>• <strong>Hapus Treatment:</strong> Hapus layanan yang tidak aktif</li>
                <li>• <strong>Kategori:</strong> Kelompokkan treatment berdasarkan jenis</li>
              </ul>
            </div>
            
            <div class="bg-green-50 p-4 rounded-lg">
              <h4 class="font-semibold text-green-800 mb-2">💰 Informasi Treatment</h4>
              <ul class="text-sm text-green-700 space-y-1">
                <li>• <strong>Nama Treatment:</strong> Nama layanan yang mudah dipahami</li>
                <li>• <strong>Harga:</strong> Tarif layanan per item</li>
                <li>• <strong>Waktu Pengerjaan:</strong> Estimasi waktu selesai</li>
                <li>• <strong>Deskripsi:</strong> Penjelasan detail layanan</li>
                <li>• <strong>Status:</strong> Aktif/Nonaktif layanan</li>
              </ul>
            </div>
            
            <div class="bg-yellow-50 p-4 rounded-lg">
              <h4 class="font-semibold text-yellow-800 mb-2">💡 Tips Pengelolaan</h4>
              <ul class="text-sm text-yellow-700 space-y-1">
                <li>• Set harga yang kompetitif</li>
                <li>• Update harga sesuai kondisi pasar</li>
                <li>• Buat kategori untuk kemudahan navigasi</li>
                <li>• Monitor treatment yang paling populer</li>
              </ul>
            </div>
          </div>
        `
      },
      'manajemen-discount': {
        title: 'Manajemen Discount',
        description: 'Kelola discount dan promo',
        icon: FaBuilding,
        content: `
          <h3 class="text-lg font-bold mb-4">Manajemen Discount</h3>
          <p class="mb-4">Manajemen Discount memungkinkan Anda membuat dan mengelola program diskon dan promo.</p>
          
          <div class="space-y-4">
            <div class="bg-blue-50 p-4 rounded-lg">
              <h4 class="font-semibold text-blue-800 mb-2">🏷️ Fitur Discount</h4>
              <p class="text-sm text-blue-700 mb-2">[TAMBAHKAN SS MANAJEMEN DISCOUNT]</p>
              <ul class="text-sm text-blue-700 space-y-1">
                <li>• <strong>Tambah Discount:</strong> Buat promo baru</li>
                <li>• <strong>Edit Discount:</strong> Update syarat dan ketentuan</li>
                <li>• <strong>Hapus Discount:</strong> Hapus promo yang sudah selesai</li>
                <li>• <strong>Status Discount:</strong> Aktif/Nonaktif promo</li>
              </ul>
            </div>
            
            <div class="bg-green-50 p-4 rounded-lg">
              <h4 class="font-semibold text-green-800 mb-2">📊 Jenis Discount</h4>
              <ul class="text-sm text-green-700 space-y-1">
                <li>• <strong>Persentase:</strong> Diskon berdasarkan persentase</li>
                <li>• <strong>Nominal:</strong> Diskon dengan jumlah tetap</li>
                <li>• <strong>Minimal Pembelian:</strong> Diskon dengan syarat minimum</li>
                <li>• <strong>Periode:</strong> Diskon dengan batas waktu</li>
              </ul>
            </div>
            
            <div class="bg-yellow-50 p-4 rounded-lg">
              <h4 class="font-semibold text-yellow-800 mb-2">💡 Tips Promo</h4>
              <ul class="text-sm text-yellow-700 space-y-1">
                <li>• Buat promo yang menarik tapi tidak merugikan</li>
                <li>• Set periode promo yang jelas</li>
                <li>• Monitor efektivitas setiap promo</li>
                <li>• Gunakan promo untuk meningkatkan penjualan</li>
              </ul>
            </div>
          </div>
        `
      },
      'manajemen-customer': {
        title: 'Manajemen Customer',
        description: 'Kelola data customer dan kontak',
        icon: FaBuilding,
        content: `
          <h3 class="text-lg font-bold mb-4">Manajemen Customer</h3>
          <p class="mb-4">Manajemen Customer memungkinkan Anda mengelola database customer dan komunikasi dengan mereka.</p>
          
          <div class="space-y-4">
            <div class="bg-blue-50 p-4 rounded-lg">
              <h4 class="font-semibold text-blue-800 mb-2">👥 Fitur Customer</h4>
              <p class="text-sm text-blue-700 mb-2">[TAMBAHKAN SS MANAJEMEN CUSTOMER]</p>
              <ul class="text-sm text-blue-700 space-y-1">
                <li>• <strong>Tambah Customer:</strong> Daftar customer baru</li>
                <li>• <strong>Edit Data:</strong> Update informasi customer</li>
                <li>• <strong>Hapus Customer:</strong> Hapus data customer</li>
                <li>• <strong>Riwayat Transaksi:</strong> Lihat history pembelian</li>
              </ul>
            </div>
            
            <div class="bg-green-50 p-4 rounded-lg">
              <h4 class="font-semibold text-green-800 mb-2">📋 Data Customer</h4>
              <ul class="text-sm text-green-700 space-y-1">
                <li>• <strong>Informasi Personal:</strong> Nama, alamat, kontak</li>
                <li>• <strong>Riwayat Order:</strong> History pesanan dan pembayaran</li>
                <li>• <strong>Preferensi:</strong> Treatment favorit dan kebiasaan</li>
                <li>• <strong>Status:</strong> Customer aktif/nonaktif</li>
              </ul>
            </div>
            
            <div class="bg-yellow-50 p-4 rounded-lg">
              <h4 class="font-semibold text-yellow-800 mb-2">💡 Tips Pengelolaan</h4>
              <ul class="text-sm text-yellow-700 space-y-1">
                <li>• Jaga data customer tetap akurat</li>
                <li>• Gunakan data untuk personalisasi layanan</li>
                <li>• Monitor customer yang tidak aktif</li>
                <li>• Bangun hubungan yang baik dengan customer</li>
              </ul>
            </div>
          </div>
        `
      },
      'manajemen-finance': {
        title: 'Manajemen Finance',
        description: 'Kelola akun keuangan dan transaksi',
        icon: FaBuilding,
        content: `
          <h3 class="text-lg font-bold mb-4">Manajemen Finance</h3>
          <p class="mb-4">Manajemen Finance memungkinkan Anda mengelola keuangan bisnis dan transaksi.</p>
          
          <div class="space-y-4">
            <div class="bg-blue-50 p-4 rounded-lg">
              <h4 class="font-semibold text-blue-800 mb-2">🏦 Fitur Finance</h4>
              <p class="text-sm text-blue-700 mb-2">[TAMBAHKAN SS MANAJEMEN FINANCE]</p>
              <ul class="text-sm text-blue-700 space-y-1">
                <li>• <strong>Akun Bank:</strong> Kelola rekening bisnis</li>
                <li>• <strong>Transaksi:</strong> Monitor pemasukan dan pengeluaran</li>
                <li>• <strong>Laporan:</strong> Generate laporan keuangan</li>
                <li>• <strong>Budget:</strong> Set target dan budget</li>
              </ul>
            </div>
            
            <div class="bg-green-50 p-4 rounded-lg">
              <h4 class="font-semibold text-green-800 mb-2">📊 Laporan Keuangan</h4>
              <ul class="text-sm text-green-700 space-y-1">
                <li>• <strong>Laporan Harian:</strong> Pemasukan dan pengeluaran harian</li>
                <li>• <strong>Laporan Bulanan:</strong> Ringkasan keuangan bulanan</li>
                <li>• <strong>Laporan Tahunan:</strong> Analisis keuangan tahunan</li>
                <li>• <strong>Profit Loss:</strong> Laporan laba rugi</li>
              </ul>
            </div>
            
            <div class="bg-yellow-50 p-4 rounded-lg">
              <h4 class="font-semibold text-yellow-800 mb-2">💡 Tips Keuangan</h4>
              <ul class="text-sm text-yellow-700 space-y-1">
                <li>• Monitor cash flow secara berkala</li>
                <li>• Set budget untuk operasional</li>
                <li>• Analisis profit margin setiap treatment</li>
                <li>• Gunakan laporan untuk pengambilan keputusan</li>
              </ul>
            </div>
          </div>
        `
      },
      'manajemen-shift': {
        title: 'Manajemen Shift',
        description: 'Lihat history shift karyawan',
        icon: FaBuilding,
        content: `
          <h3 class="text-lg font-bold mb-4">Manajemen Shift</h3>
          <p class="mb-4">Manajemen Shift memungkinkan Anda memantau jam kerja dan produktivitas karyawan.</p>
          
          <div class="space-y-4">
            <div class="bg-blue-50 p-4 rounded-lg">
              <h4 class="font-semibold text-blue-800 mb-2">⏰ Fitur Shift</h4>
              <p class="text-sm text-blue-700 mb-2">[TAMBAHKAN SS MANAJEMEN SHIFT]</p>
              <ul class="text-sm text-blue-700 space-y-1">
                <li>• <strong>History Shift:</strong> Lihat riwayat jam kerja karyawan</li>
                <li>• <strong>Absensi:</strong> Monitor kehadiran dan izin</li>
                <li>• <strong>Overtime:</strong> Track jam lembur karyawan</li>
                <li>• <strong>Produktivitas:</strong> Analisis performa karyawan</li>
              </ul>
            </div>
            
            <div class="bg-green-50 p-4 rounded-lg">
              <h4 class="font-semibold text-green-800 mb-2">📊 Data Shift</h4>
              <ul class="text-sm text-green-700 space-y-1">
                <li>• <strong>Jam Masuk:</strong> Waktu check-in karyawan</li>
                <li>• <strong>Jam Keluar:</strong> Waktu check-out karyawan</li>
                <li>• <strong>Durasi Kerja:</strong> Total jam kerja per hari</li>
                <li>• <strong>Status:</strong> Hadir, izin, sakit, dll</li>
              </ul>
            </div>
            
            <div class="bg-yellow-50 p-4 rounded-lg">
              <h4 class="font-semibold text-yellow-800 mb-2">💡 Tips Monitoring</h4>
              <ul class="text-sm text-yellow-700 space-y-1">
                <li>• Monitor pola kehadiran karyawan</li>
                <li>• Identifikasi karyawan yang sering izin</li>
                <li>• Hitung gaji berdasarkan jam kerja</li>
                <li>• Gunakan data untuk evaluasi karyawan</li>
              </ul>
            </div>
          </div>
        `
      },
      'manajemen-printer': {
        title: 'Manajemen Printer',
        description: 'Kelola printer dan koneksi Bluetooth',
        icon: FaBuilding,
        content: `
          <h3 class="text-lg font-bold mb-4">Manajemen Printer</h3>
          <p class="mb-4">Manajemen Printer memungkinkan Anda mengkonfigurasi printer thermal untuk mencetak struk.</p>
          
          <div class="space-y-4">
            <div class="bg-blue-50 p-4 rounded-lg">
              <h4 class="font-semibold text-blue-800 mb-2">🖨️ Fitur Printer</h4>
              <p class="text-sm text-blue-700 mb-2">[TAMBAHKAN SS MANAJEMEN PRINTER]</p>
              <ul class="text-sm text-blue-700 space-y-1">
                <li>• <strong>Scan Printer:</strong> Cari printer Bluetooth yang tersedia</li>
                <li>• <strong>Connect Printer:</strong> Hubungkan printer ke sistem</li>
                <li>• <strong>Test Print:</strong> Test koneksi printer</li>
                <li>• <strong>Disconnect:</strong> Putuskan koneksi printer</li>
              </ul>
            </div>
            
            <div class="bg-green-50 p-4 rounded-lg">
              <h4 class="font-semibold text-green-800 mb-2">⚙️ Konfigurasi Printer</h4>
              <ul class="text-sm text-green-700 space-y-1">
                <li>• <strong>Nama Printer:</strong> Identitas printer</li>
                <li>• <strong>Alamat Bluetooth:</strong> MAC address printer</li>
                <li>• <strong>Status:</strong> Terhubung/Tidak terhubung</li>
                <li>• <strong>Paper Size:</strong> Ukuran kertas struk</li>
              </ul>
            </div>
            
            <div class="bg-yellow-50 p-4 rounded-lg">
              <h4 class="font-semibold text-yellow-800 mb-2">💡 Tips Printer</h4>
              <ul class="text-sm text-yellow-700 space-y-1">
                <li>• Pastikan printer dalam jangkauan Bluetooth</li>
                <li>• Test print sebelum digunakan untuk transaksi</li>
                <li>• Ganti kertas struk secara berkala</li>
                <li>• Backup konfigurasi printer</li>
              </ul>
            </div>
          </div>
        `
      },
      'pengaturan-whatsapp': {
        title: 'Pengaturan WhatsApp',
        description: 'Konfigurasi WhatsApp per cabang',
        icon: FaBuilding,
        content: `
          <h3 class="text-lg font-bold mb-4">Pengaturan WhatsApp</h3>
          <p class="mb-4">Pengaturan WhatsApp memungkinkan Anda mengkonfigurasi WhatsApp Business API untuk notifikasi otomatis.</p>
          
          <div class="space-y-4">
            <div class="bg-blue-50 p-4 rounded-lg">
              <h4 class="font-semibold text-blue-800 mb-2">💬 Fitur WhatsApp</h4>
              <p class="text-sm text-blue-700 mb-2">[TAMBAHKAN SS PENGATURAN WHATSAPP]</p>
              <ul class="text-sm text-blue-700 space-y-1">
                <li>• <strong>Setup WhatsApp:</strong> Konfigurasi WhatsApp Business API</li>
                <li>• <strong>Template Pesan:</strong> Buat template notifikasi</li>
                <li>• <strong>Test Message:</strong> Test pengiriman pesan</li>
                <li>• <strong>Status Koneksi:</strong> Monitor status WhatsApp</li>
              </ul>
            </div>
            
            <div class="bg-green-50 p-4 rounded-lg">
              <h4 class="font-semibold text-green-800 mb-2">📱 Jenis Notifikasi</h4>
              <ul class="text-sm text-green-700 space-y-1">
                <li>• <strong>Order Confirmation:</strong> Konfirmasi pesanan masuk</li>
                <li>• <strong>Status Update:</strong> Update status pengerjaan</li>
                <li>• <strong>Ready Notification:</strong> Notifikasi item siap</li>
                <li>• <strong>Payment Reminder:</strong> Pengingat pembayaran</li>
              </ul>
            </div>
            
            <div class="bg-yellow-50 p-4 rounded-lg">
              <h4 class="font-semibold text-yellow-800 mb-2">💡 Tips WhatsApp</h4>
              <ul class="text-sm text-yellow-700 space-y-1">
                <li>• Buat template pesan yang profesional</li>
                <li>• Test notifikasi secara berkala</li>
                <li>• Monitor deliverability pesan</li>
                <li>• Gunakan untuk meningkatkan customer experience</li>
              </ul>
            </div>
          </div>
        `
      },
      karyawan: {
        title: 'Manajemen Karyawan',
        description: 'Cara menambah dan mengatur karyawan',
        icon: FaUsers,
        content: `
          <h3 class="text-lg font-bold mb-4">Manajemen Karyawan</h3>
          <p class="mb-4">Kelola karyawan dengan mudah melalui menu Manajemen Karyawan:</p>
          
          <div class="space-y-4">
            <div class="bg-blue-50 p-4 rounded-lg">
              <h4 class="font-semibold text-blue-800 mb-2">➕ Menambah Karyawan Baru</h4>
              <ol class="text-sm text-blue-700 space-y-1">
                <li>1. Klik tombol "Tambah Karyawan"</li>
                <li>2. Isi data lengkap karyawan</li>
                <li>3. Pilih role (Admin, Teknisi, Kasir, Kurir)</li>
                <li>4. Simpan data</li>
                <li>5. Karyawan akan mendapat email berisi login</li>
              </ol>
            </div>
            
            <div class="bg-green-50 p-4 rounded-lg">
              <h4 class="font-semibold text-green-800 mb-2">✏️ Mengedit Data Karyawan</h4>
              <ul class="text-sm text-green-700 space-y-1">
                <li>• Klik nama karyawan untuk mengedit</li>
                <li>• Ubah informasi yang diperlukan</li>
                <li>• Simpan perubahan</li>
              </ul>
            </div>
            
            <div class="bg-red-50 p-4 rounded-lg">
              <h4 class="font-semibold text-red-800 mb-2">🚫 Menonaktifkan Karyawan</h4>
              <ul class="text-sm text-red-700 space-y-1">
                <li>• Klik tombol "Nonaktifkan"</li>
                <li>• Konfirmasi tindakan</li>
                <li>• Karyawan tidak bisa login lagi</li>
              </ul>
            </div>
          </div>
        `
      }
    },
    teknisi: {
      'dashboard-teknisi': {
        title: 'Dashboard Teknisi',
        description: 'Beranda teknisi dan daftar tugas',
        icon: FaCogs,
        content: `
          <h3 class="text-lg font-bold mb-4">Dashboard Teknisi</h3>
          <p class="mb-4">Dashboard teknisi adalah pusat kontrol untuk pekerjaan cuci harian.</p>
          
          <div class="space-y-4">
            <div class="bg-blue-50 p-4 rounded-lg">
              <h4 class="font-semibold text-blue-800 mb-2">📊 Informasi Antrian</h4>
              <p class="text-sm text-blue-700 mb-2">[TAMBAHKAN SS DASHBOARD TEKNISI]</p>
              <ul class="text-sm text-blue-700 space-y-1">
                <li>• <strong>Regular:</strong> Cuci biasa (1-2 hari)</li>
                <li>• <strong>Same Day:</strong> Cuci kilat (hari yang sama)</li>
                <li>• <strong>Next Day:</strong> Cuci besok</li>
                <li>• Total antrian yang perlu dikerjakan</li>
              </ul>
            </div>
            
            <div class="bg-green-50 p-4 rounded-lg">
              <h4 class="font-semibold text-green-800 mb-2">🎯 Akses Cepat</h4>
              <p class="text-sm text-green-700 mb-2">Dari dashboard teknisi, Anda bisa langsung:</p>
              <ul class="text-sm text-green-700 space-y-1">
                <li>• Masuk ke Antrian Teknisi untuk mulai bekerja</li>
                <li>• Lihat treatment yang paling banyak dipesan</li>
                <li>• Monitor progress pekerjaan harian</li>
              </ul>
            </div>
            
            <div class="bg-yellow-50 p-4 rounded-lg">
              <h4 class="font-semibold text-yellow-800 mb-2">💡 Tips Penting</h4>
              <ul class="text-sm text-yellow-700 space-y-1">
                <li>• Prioritaskan Same Day dan Next Day</li>
                <li>• Selalu upload foto dokumentasi</li>
                <li>• Update status secara berkala</li>
                <li>• Komunikasi dengan kasir jika ada masalah</li>
              </ul>
            </div>
          </div>
        `
      },
      'antrian-teknisi': {
        title: 'Antrian Teknisi',
        description: 'Mengakses dan mengelola antrian cuci',
        icon: FaCogs,
        content: `
          <h3 class="text-lg font-bold mb-4">Antrian Teknisi</h3>
          <p class="mb-4">Antrian teknisi adalah tempat untuk memproses semua pesanan cuci.</p>
          
          <div class="space-y-4">
            <div class="bg-blue-50 p-4 rounded-lg">
              <h4 class="font-semibold text-blue-800 mb-2">📋 Status yang Dikelola</h4>
              <p class="text-sm text-blue-700 mb-2">[TAMBAHKAN SS ANTRIAN TEKNISI]</p>
              <ul class="text-sm text-blue-700 space-y-1">
                <li>• <strong>Not Yet:</strong> Item belum dikerjakan</li>
                <li>• <strong>Antrian:</strong> Item dalam antrian</li>
                <li>• <strong>On Progress:</strong> Sedang dikerjakan</li>
                <li>• <strong>Not Ready:</strong> Tidak lolos QC, perlu ulangi</li>
              </ul>
            </div>
            
            <div class="bg-green-50 p-4 rounded-lg">
              <h4 class="font-semibold text-green-800 mb-2">▶️ Memulai Treatment</h4>
              <p class="text-sm text-green-700 mb-2">Untuk memulai pekerjaan:</p>
              <ol class="text-sm text-green-700 space-y-1">
                <li>1. Klik "Mulai Treatment" pada item yang akan dikerjakan</li>
                <li>2. Timer akan mulai berjalan otomatis</li>
                <li>3. Status berubah menjadi "On Progress"</li>
                <li>4. Upload foto dokumentasi setiap perubahan status</li>
                <li>5. Klik "Selesai" setelah pekerjaan selesai</li>
              </ol>
            </div>
            
            <div class="bg-yellow-50 p-4 rounded-lg">
              <h4 class="font-semibold text-yellow-800 mb-2">🏷️ Priority Badges</h4>
              <ul class="text-sm text-yellow-700 space-y-1">
                <li>• <strong>"Tidak Lolos QC":</strong> Item perlu dikerjakan ulang</li>
                <li>• <strong>"Menunggu Pickup":</strong> Item menunggu dijemput kurir</li>
                <li>• Badge berwarna orange dengan animasi pulse</li>
              </ul>
            </div>
          </div>
        `
      }
    },
    kasir: {
      'dashboard-kasir': {
        title: 'Dashboard Kasir',
        description: 'Beranda kasir dan informasi harian',
        icon: FaCashRegister,
        content: `
          <h3 class="text-lg font-bold mb-4">Dashboard Kasir</h3>
          <p class="mb-4">Dashboard kasir adalah pusat kontrol untuk operasional harian cabang.</p>
          
          <div class="space-y-4">
            <div class="bg-blue-50 p-4 rounded-lg">
              <h4 class="font-semibold text-blue-800 mb-2">📊 Menu Utama</h4>
              <p class="text-sm text-blue-700 mb-2">[TAMBAHKAN SS DASHBOARD KASIR]</p>
              <ul class="text-sm text-blue-700 space-y-1">
                <li>• <strong>Orders:</strong> Input pesanan baru</li>
                <li>• <strong>Shift:</strong> Kelola shift kerja</li>
                <li>• <strong>Pengaturan:</strong> Akses pengaturan terbatas</li>
                <li>• <strong>Date Range:</strong> Pilih tanggal untuk melihat data</li>
              </ul>
            </div>
            
            <div class="bg-green-50 p-4 rounded-lg">
              <h4 class="font-semibold text-green-800 mb-2">📈 Informasi Harian</h4>
              <ul class="text-sm text-green-700 space-y-1">
                <li>• Jumlah item yang perlu QC hari ini</li>
                <li>• Treatment yang paling banyak dipesan</li>
                <li>• Total antrian yang perlu diproses</li>
                <li>• Status pembayaran pelanggan</li>
              </ul>
            </div>
            
            <div class="bg-yellow-50 p-4 rounded-lg">
              <h4 class="font-semibold text-yellow-800 mb-2">🎯 Akses Cepat</h4>
              <p class="text-sm text-yellow-700 mb-2">Dari dashboard kasir, Anda bisa langsung:</p>
              <ul class="text-sm text-yellow-700 space-y-1">
                <li>• Masuk ke Antrian Kasir untuk QC</li>
                <li>• Input pesanan baru</li>
                <li>• Lihat pengaturan terbatas</li>
                <li>• Kelola shift kerja</li>
              </ul>
            </div>
          </div>
        `
      },
      'quality-control': {
        title: 'Quality Control',
        description: 'Memutuskan lolos/tidak lolos QC',
        icon: FaCashRegister,
        content: `
          <h3 class="text-lg font-bold mb-4">Quality Control (QC)</h3>
          <p class="mb-4">QC adalah proses pengecekan kualitas cucian sebelum diberikan ke customer.</p>
          
          <div class="space-y-4">
            <div class="bg-blue-50 p-4 rounded-lg">
              <h4 class="font-semibold text-blue-800 mb-2">✅ Proses QC</h4>
              <p class="text-sm text-blue-700 mb-2">[TAMBAHKAN SS MODAL QC]</p>
              <ol class="text-sm text-blue-700 space-y-1">
                <li>1. Item dengan status "Pengeringan" masuk antrian QC</li>
                <li>2. Klik item untuk membuka modal QC</li>
                <li>3. Lihat foto dokumentasi dari teknisi</li>
                <li>4. Periksa kualitas cucian secara visual</li>
                <li>5. Pilih "Lolos QC" atau "Tidak Lolos QC"</li>
              </ol>
            </div>
            
            <div class="bg-green-50 p-4 rounded-lg">
              <h4 class="font-semibold text-green-800 mb-2">✅ Jika Lolos QC</h4>
              <ul class="text-sm text-green-700 space-y-1">
                <li>• Status berubah menjadi "Siap"</li>
                <li>• Item masuk ke tahap pemilihan metode pengiriman</li>
                <li>• Customer bisa memilih diantar atau ambil sendiri</li>
                <li>• Proses pembayaran bisa dilakukan</li>
              </ul>
            </div>
            
            <div class="bg-red-50 p-4 rounded-lg">
              <h4 class="font-semibold text-red-800 mb-2">❌ Jika Tidak Lolos QC</h4>
              <ul class="text-sm text-red-700 space-y-1">
                <li>• Status berubah menjadi "Not Ready"</li>
                <li>• Item kembali ke teknisi untuk dikerjakan ulang</li>
                <li>• Badge "Tidak Lolos QC" muncul di antrian teknisi</li>
                <li>• Teknisi harus memperbaiki sesuai standar</li>
              </ul>
            </div>
          </div>
        `
      }
    },
    'admin-kasir': {
      'dashboard-admin-kasir': {
        title: 'Dashboard Admin/Kasir',
        description: 'Beranda admin/kasir dengan date range dan statistik',
        icon: FaUsers,
        content: `
          <h3 class="text-lg font-bold mb-4">Dashboard Admin/Kasir</h3>
          <p class="mb-4">Dashboard admin/kasir adalah pusat kontrol untuk operasional harian dan transaksi cabang.</p>
          
          <div class="space-y-4">
            <div class="bg-blue-50 p-4 rounded-lg">
              <h4 class="font-semibold text-blue-800 mb-2">📅 Date Range Picker</h4>
              <p class="text-sm text-blue-700 mb-2">[TAMBAHKAN SS DATE RANGE PICKER]</p>
              <ul class="text-sm text-blue-700 space-y-1">
                <li>• Pilih tanggal untuk melihat data antrian</li>
                <li>• Bisa pilih range tanggal atau tanggal tunggal</li>
                <li>• Data otomatis update sesuai tanggal yang dipilih</li>
                <li>• Range tanggal tersimpan di localStorage</li>
              </ul>
            </div>
            
            <div class="bg-green-50 p-4 rounded-lg">
              <h4 class="font-semibold text-green-800 mb-2">📊 Statistik & Antrian</h4>
              <p class="text-sm text-green-700 mb-2">[TAMBAHKAN SS STATISTIK ANTRIAN]</p>
              <ul class="text-sm text-green-700 space-y-1">
                <li>• <strong>Top Treatments:</strong> Treatment yang paling banyak dipesan</li>
                <li>• <strong>Total Antrian:</strong> Jumlah antrian yang perlu diproses</li>
                <li>• <strong>Status Antrian:</strong> pengeringan, siap, siap diambil</li>
                <li>• <strong>Action Menu:</strong> Orders, Shift, Pengaturan</li>
              </ul>
            </div>
            
            <div class="bg-yellow-50 p-4 rounded-lg">
              <h4 class="font-semibold text-yellow-800 mb-2">🎯 Akses Cepat</h4>
              <p class="text-sm text-yellow-700 mb-2">Dari dashboard admin/kasir, Anda bisa langsung:</p>
              <ul class="text-sm text-yellow-700 space-y-1">
                <li>• Masuk ke Antrian Kasir untuk QC dan pembayaran</li>
                <li>• Kelola Orders dan Shift</li>
                <li>• Akses Pengaturan Admin</li>
                <li>• Lihat statistik performa harian</li>
              </ul>
            </div>
          </div>
        `
      },
      'antrian-admin-kasir': {
        title: 'Antrian Admin/Kasir',
        description: 'Mengelola antrian QC dan pembayaran dengan search',
        icon: FaUsers,
        content: `
          <h3 class="text-lg font-bold mb-4">Antrian Admin/Kasir</h3>
          <p class="mb-4">Halaman antrian admin/kasir untuk mengelola QC dan pembayaran dengan fitur search dan filter.</p>
          
          <div class="space-y-4">
            <div class="bg-blue-50 p-4 rounded-lg">
              <h4 class="font-semibold text-blue-800 mb-2">🔍 Search Function</h4>
              <p class="text-sm text-blue-700 mb-2">[TAMBAHKAN SS SEARCH BAR]</p>
              <ul class="text-sm text-blue-700 space-y-1">
                <li>• Cari customer berdasarkan nama atau alamat</li>
                <li>• Search dengan debounce untuk performa</li>
                <li>• Hasil search akan difilter secara real-time</li>
                <li>• Kosongkan search untuk melihat semua data</li>
              </ul>
            </div>
            
            <div class="bg-green-50 p-4 rounded-lg">
              <h4 class="font-semibold text-green-800 mb-2">📋 Status Management</h4>
              <p class="text-sm text-green-700 mb-2">Kelola status item:</p>
              <ul class="text-sm text-green-700 space-y-1">
                <li>• <strong>Pengeringan:</strong> Item siap untuk QC</li>
                <li>• <strong>Siap:</strong> Item lolos QC, pilih metode pengiriman</li>
                <li>• <strong>Siap Diambil:</strong> Item sudah dibayar</li>
                <li>• Filter berdasarkan status yang dipilih</li>
              </ul>
            </div>
            
            <div class="bg-yellow-50 p-4 rounded-lg">
              <h4 class="font-semibold text-yellow-800 mb-2">📱 Fitur Pendukung</h4>
              <p class="text-sm text-yellow-700 mb-2">Fitur komunikasi dan dokumentasi:</p>
              <ul class="text-sm text-yellow-700 space-y-1">
                <li>• <strong>WhatsApp:</strong> Kirim notifikasi ke customer</li>
                <li>• <strong>Upload Foto:</strong> Dokumentasi QC dan pembayaran</li>
                <li>• <strong>Cetak Struk:</strong> Print struk pembayaran</li>
                <li>• <strong>Metode Pengiriman:</strong> Antar atau ambil di toko</li>
              </ul>
            </div>
          </div>
        `
      },
      'quality-control': {
        title: 'Quality Control',
        description: 'Cek kualitas cucian dan keputusan QC',
        icon: FaUsers,
        content: `
          <h3 class="text-lg font-bold mb-4">Quality Control</h3>
          <p class="mb-4">Quality Control adalah proses pengecekan kualitas cucian sebelum diserahkan ke customer.</p>
          
          <div class="space-y-4">
            <div class="bg-blue-50 p-4 rounded-lg">
              <h4 class="font-semibold text-blue-800 mb-2">✅ Proses QC</h4>
              <p class="text-sm text-blue-700 mb-2">[TAMBAHKAN SS QC MODAL]</p>
              <ol class="text-sm text-blue-700 space-y-1">
                <li>1. Item dengan status "Pengeringan" siap untuk QC</li>
                <li>2. Klik tombol QC pada item yang akan dicek</li>
                <li>3. Modal QC akan terbuka</li>
                <li>4. Pilih "Lolos QC" atau "Tidak Lolos QC"</li>
                <li>5. Upload foto sebagai bukti QC</li>
                <li>6. Klik "Konfirmasi" untuk menyimpan</li>
              </ol>
            </div>
            
            <div class="bg-green-50 p-4 rounded-lg">
              <h4 class="font-semibold text-green-800 mb-2">📸 Dokumentasi QC</h4>
              <p class="text-sm text-green-700 mb-2">Foto yang diperlukan:</p>
              <ul class="text-sm text-green-700 space-y-1">
                <li>• <strong>Lolos QC:</strong> Foto item yang sudah bersih</li>
                <li>• <strong>Tidak Lolos QC:</strong> Foto bagian yang perlu diperbaiki</li>
                <li>• Pastikan foto jelas dan terlihat</li>
                <li>• Foto akan tersimpan sebagai bukti transparan</li>
              </ul>
            </div>
            
            <div class="bg-yellow-50 p-4 rounded-lg">
              <h4 class="font-semibold text-yellow-800 mb-2">💡 Tips QC yang Baik</h4>
              <ul class="text-sm text-yellow-700 space-y-1">
                <li>• Cek semua bagian item secara detail</li>
                <li>• Pastikan tidak ada noda atau kerusakan</li>
                <li>• Jika tidak lolos, berikan catatan perbaikan</li>
                <li>• Komunikasi dengan teknisi jika perlu perbaikan</li>
              </ul>
            </div>
          </div>
        `
      },
      'proses-pembayaran': {
        title: 'Proses Pembayaran',
        description: 'Handle pembayaran dan cetak struk',
        icon: FaUsers,
        content: `
          <h3 class="text-lg font-bold mb-4">Proses Pembayaran</h3>
          <p class="mb-4">Proses pembayaran adalah tahap akhir sebelum item diserahkan ke customer.</p>
          
          <div class="space-y-4">
            <div class="bg-blue-50 p-4 rounded-lg">
              <h4 class="font-semibold text-blue-800 mb-2">💳 Langkah Pembayaran</h4>
              <p class="text-sm text-blue-700 mb-2">[TAMBAHKAN SS PROSES PEMBAYARAN]</p>
              <ol class="text-sm text-blue-700 space-y-1">
                <li>1. Item dengan status "Siap" siap untuk pembayaran</li>
                <li>2. Klik tombol pembayaran pada item</li>
                <li>3. Pilih metode pembayaran (Cash, Transfer, dll)</li>
                <li>4. Input jumlah pembayaran</li>
                <li>5. Hitung kembalian jika ada</li>
                <li>6. Cetak struk pembayaran</li>
                <li>7. Upload foto struk sebagai bukti</li>
                <li>8. Status item berubah menjadi "Siap Diambil"</li>
              </ol>
            </div>
            
            <div class="bg-green-50 p-4 rounded-lg">
              <h4 class="font-semibold text-green-800 mb-2">🖨️ Cetak Struk</h4>
              <p class="text-sm text-green-700 mb-2">Fitur cetak struk:</p>
              <ul class="text-sm text-green-700 space-y-1">
                <li>• <strong>Struk Otomatis:</strong> Generate struk setelah pembayaran</li>
                <li>• <strong>Printer Bluetooth:</strong> Cetak langsung ke printer</li>
                <li>• <strong>Format Struk:</strong> Nama customer, item, harga, tanggal</li>
                <li>• <strong>Backup Digital:</strong> Struk tersimpan di sistem</li>
              </ul>
            </div>
            
            <div class="bg-yellow-50 p-4 rounded-lg">
              <h4 class="font-semibold text-yellow-800 mb-2">📱 Metode Pengiriman</h4>
              <p class="text-sm text-yellow-700 mb-2">Setelah pembayaran, pilih metode pengiriman:</p>
              <ul class="text-sm text-yellow-700 space-y-1">
                <li>• <strong>Diambil di Toko:</strong> Customer ambil sendiri</li>
                <li>• <strong>Diantar:</strong> Kurir akan mengantar</li>
                <li>• <strong>WhatsApp:</strong> Kirim notifikasi ke customer</li>
                <li>• <strong>Koordinasi:</strong> Pastikan customer siap menerima</li>
              </ul>
            </div>
          </div>
        `
      },
      'pengaturan-admin': {
        title: 'Pengaturan Admin',
        description: 'Kelola pengaturan terbatas cabang',
        icon: FaUsers,
        content: `
          <h3 class="text-lg font-bold mb-4">Pengaturan Admin</h3>
          <p class="mb-4">Pengaturan admin adalah menu terbatas untuk mengelola konfigurasi cabang.</p>
          
          <div class="space-y-4">
            <div class="bg-blue-50 p-4 rounded-lg">
              <h4 class="font-semibold text-blue-800 mb-2">⚙️ Menu Pengaturan</h4>
              <p class="text-sm text-blue-700 mb-2">[TAMBAHKAN SS PENGATURAN ADMIN]</p>
              <ul class="text-sm text-blue-700 space-y-1">
                <li>• <strong>Manajemen Treatment:</strong> Kelola treatment dan layanan</li>
                <li>• <strong>Manajemen Discount:</strong> Kelola discount dan promo</li>
                <li>• <strong>Manajemen Customer:</strong> Kelola data customer</li>
                <li>• <strong>Manajemen Printer:</strong> Kelola printer Bluetooth</li>
                <li>• <strong>Pengaturan WhatsApp:</strong> Konfigurasi WhatsApp</li>
              </ul>
            </div>
            
            <div class="bg-green-50 p-4 rounded-lg">
              <h4 class="font-semibold text-green-800 mb-2">🔒 Akses Terbatas</h4>
              <p class="text-sm text-green-700 mb-2">Admin hanya bisa:</p>
              <ul class="text-sm text-green-700 space-y-1">
                <li>• <strong>Read & Edit:</strong> Bisa lihat dan edit data</li>
                <li>• <strong>Tidak Bisa Delete:</strong> Tidak bisa hapus data penting</li>
                <li>• <strong>Cabang Terbatas:</strong> Hanya cabang sendiri</li>
                <li>• <strong>Supervisi Owner:</strong> Owner tetap bisa monitor</li>
              </ul>
            </div>
            
            <div class="bg-yellow-50 p-4 rounded-lg">
              <h4 class="font-semibold text-yellow-800 mb-2">💡 Tips Penggunaan</h4>
              <ul class="text-sm text-yellow-700 space-y-1">
                <li>• Update treatment sesuai kebutuhan cabang</li>
                <li>• Set discount untuk promo khusus</li>
                <li>• Kelola data customer dengan baik</li>
                <li>• Pastikan printer terhubung dengan baik</li>
                <li>• Test WhatsApp notifikasi secara berkala</li>
              </ul>
            </div>
          </div>
        `
      }
    },
    kurir: {
      'dashboard-kurir': {
        title: 'Dashboard Kurir',
        description: 'Beranda kurir dengan date range dan counter antrian',
        icon: FaTruck,
        content: `
          <h3 class="text-lg font-bold mb-4">Dashboard Kurir</h3>
          <p class="mb-4">Dashboard kurir adalah pusat kontrol untuk pekerjaan pickup dan delivery dengan fitur date range picker.</p>
          
          <div class="space-y-4">
            <div class="bg-blue-50 p-4 rounded-lg">
              <h4 class="font-semibold text-blue-800 mb-2">📅 Date Range Picker</h4>
              <p class="text-sm text-blue-700 mb-2">[TAMBAHKAN SS DATE RANGE PICKER]</p>
              <ul class="text-sm text-blue-700 space-y-1">
                <li>• Pilih tanggal untuk melihat data antrian</li>
                <li>• Bisa pilih range tanggal atau tanggal tunggal</li>
                <li>• Data otomatis update sesuai tanggal yang dipilih</li>
                <li>• Range tanggal tersimpan di localStorage</li>
              </ul>
            </div>
            
            <div class="bg-green-50 p-4 rounded-lg">
              <h4 class="font-semibold text-green-800 mb-2">📊 Counter Antrian</h4>
              <p class="text-sm text-green-700 mb-2">[TAMBAHKAN SS COUNTER ANTRIAN]</p>
              <ul class="text-sm text-green-700 space-y-1">
                <li>• <strong>Pick Up:</strong> Item yang perlu dijemput dari customer</li>
                <li>• <strong>Delivery:</strong> Item yang perlu diantar ke customer</li>
                <li>• <strong>Total Antrian:</strong> Jumlah semua antrian yang perlu diproses</li>
                <li>• Toggle antara pickup dan delivery untuk melihat detail</li>
              </ul>
            </div>
            
            <div class="bg-yellow-50 p-4 rounded-lg">
              <h4 class="font-semibold text-yellow-800 mb-2">🚀 Buka Antrian</h4>
              <p class="text-sm text-yellow-700 mb-2">Setelah memilih pickup atau delivery:</p>
              <ul class="text-sm text-yellow-700 space-y-1">
                <li>• Klik "Buka Antrian" untuk masuk ke halaman antrian</li>
                <li>• Data akan difilter sesuai tipe yang dipilih</li>
                <li>• Range tanggal akan diteruskan ke halaman antrian</li>
              </ul>
            </div>
          </div>
        `
      },
      'antrian-kurir': {
        title: 'Antrian Kurir',
        description: 'Mengelola antrian pickup dan delivery dengan search',
        icon: FaTruck,
        content: `
          <h3 class="text-lg font-bold mb-4">Antrian Kurir</h3>
          <p class="mb-4">Halaman antrian kurir untuk mengelola pickup dan delivery dengan fitur search dan customer grouping.</p>
          
          <div class="space-y-4">
            <div class="bg-blue-50 p-4 rounded-lg">
              <h4 class="font-semibold text-blue-800 mb-2">🔍 Search Function</h4>
              <p class="text-sm text-blue-700 mb-2">[TAMBAHKAN SS SEARCH BAR]</p>
              <ul class="text-sm text-blue-700 space-y-1">
                <li>• Cari customer berdasarkan nama atau alamat</li>
                <li>• Search dengan debounce 500ms untuk performa</li>
                <li>• Hasil search akan difilter secara real-time</li>
                <li>• Kosongkan search untuk melihat semua data</li>
              </ul>
            </div>
            
            <div class="bg-green-50 p-4 rounded-lg">
              <h4 class="font-semibold text-green-800 mb-2">👥 Customer Grouping</h4>
              <p class="text-sm text-green-700 mb-2">Sistem otomatis mengelompokkan customer:</p>
              <ul class="text-sm text-green-700 space-y-1">
                <li>• Group berdasarkan nama + nomor telepon</li>
                <li>• Customer dengan multiple item akan digabung</li>
                <li>• Menampilkan jumlah item per customer</li>
                <li>• Efisiensi dalam proses pickup/delivery</li>
              </ul>
            </div>
            
            <div class="bg-yellow-50 p-4 rounded-lg">
              <h4 class="font-semibold text-yellow-800 mb-2">📱 WhatsApp & Copy Address</h4>
              <p class="text-sm text-yellow-700 mb-2">Fitur komunikasi dan navigasi:</p>
              <ul class="text-sm text-yellow-700 space-y-1">
                <li>• <strong>WhatsApp:</strong> Kirim notifikasi ke customer</li>
                <li>• <strong>Copy Address:</strong> Copy alamat untuk navigasi</li>
                <li>• <strong>Detail Item:</strong> Lihat detail item customer</li>
                <li>• <strong>Format Nomor:</strong> Otomatis format ke 62xx</li>
              </ul>
            </div>
            
            <div class="bg-purple-50 p-4 rounded-lg">
              <h4 class="font-semibold text-purple-800 mb-2">📋 Informasi Customer</h4>
              <p class="text-sm text-purple-700 mb-2">Setiap card customer menampilkan:</p>
              <ul class="text-sm text-purple-700 space-y-1">
                <li>• Nama customer dan nomor telepon</li>
                <li>• Alamat lengkap customer</li>
                <li>• Waktu delivery yang dijadwalkan</li>
                <li>• Status delivery (scheduled, dll)</li>
              </ul>
            </div>
          </div>
        `
      },
      'proses-pickup': {
        title: 'Proses Pickup',
        description: 'Cara menjemput laundry dari customer',
        icon: FaTruck,
        content: `
          <h3 class="text-lg font-bold mb-4">Proses Pickup</h3>
          <p class="mb-4">Pickup adalah proses menjemput sepatu dari customer untuk dicuci.</p>
          
          <div class="space-y-4">
            <div class="bg-blue-50 p-4 rounded-lg">
              <h4 class="font-semibold text-blue-800 mb-2">📦 Langkah Pickup Lengkap</h4>
              <p class="text-sm text-blue-700 mb-2">[TAMBAHKAN SS ANTRIAN KURIR PICKUP]</p>
              <ol class="text-sm text-blue-700 space-y-1">
                <li>1. Pilih "Pick Up" di dashboard kurir</li>
                <li>2. Klik "Buka Antrian" untuk masuk ke antrian pickup</li>
                <li>3. Lihat customer yang perlu dijemput (grouping otomatis)</li>
                <li>4. Kirim WhatsApp notifikasi ke customer</li>
                <li>5. Copy alamat untuk navigasi</li>
                <li>6. Lihat detail item customer (klik tombol "i")</li>
                <li>7. Pergi ke alamat customer</li>
                <li>8. Ambil sepatu dari customer</li>
                <li>9. Upload foto sebagai bukti pickup</li>
                <li>10. Klik "Selesai" untuk menyelesaikan pickup</li>
              </ol>
            </div>
            
            <div class="bg-green-50 p-4 rounded-lg">
              <h4 class="font-semibold text-green-800 mb-2">📱 WhatsApp & Komunikasi</h4>
              <p class="text-sm text-green-700 mb-2">Fitur komunikasi dengan customer:</p>
              <ul class="text-sm text-green-700 space-y-1">
                <li>• <strong>Tombol WhatsApp:</strong> Hijau dengan icon WhatsApp</li>
                <li>• <strong>Template Pesan:</strong> Notifikasi akan menjemput sepatu</li>
                <li>• <strong>Format Nomor:</strong> Otomatis jadi 62xx</li>
                <li>• <strong>Konfirmasi:</strong> Pastikan customer siap menerima</li>
              </ul>
            </div>
            
            <div class="bg-yellow-50 p-4 rounded-lg">
              <h4 class="font-semibold text-yellow-800 mb-2">🗺️ Navigasi & Detail</h4>
              <p class="text-sm text-yellow-700 mb-2">Fitur navigasi dan informasi:</p>
              <ul class="text-sm text-yellow-700 space-y-1">
                <li>• <strong>Copy Address:</strong> Copy alamat ke clipboard</li>
                <li>• <strong>Detail Item:</strong> Lihat brand, treatment, status</li>
                <li>• <strong>Customer Grouping:</strong> Multiple item jadi satu card</li>
                <li>• <strong>Search:</strong> Cari customer berdasarkan nama/alamat</li>
              </ul>
            </div>
            
            <div class="bg-purple-50 p-4 rounded-lg">
              <h4 class="font-semibold text-purple-800 mb-2">📸 Dokumentasi Wajib</h4>
              <ul class="text-sm text-purple-700 space-y-1">
                <li>• Foto sepatu yang dijemput</li>
                <li>• Foto lokasi pickup (opsional)</li>
                <li>• Foto sebagai bukti transparan</li>
                <li>• Data waktu pickup tersimpan otomatis</li>
              </ul>
            </div>
          </div>
        `
      },
      'proses-delivery': {
        title: 'Proses Delivery',
        description: 'Cara mengantar laundry ke customer',
        icon: FaTruck,
        content: `
          <h3 class="text-lg font-bold mb-4">Proses Delivery</h3>
          <p class="mb-4">Delivery adalah proses mengantar sepatu yang sudah dicuci ke customer.</p>
          
          <div class="space-y-4">
            <div class="bg-blue-50 p-4 rounded-lg">
              <h4 class="font-semibold text-blue-800 mb-2">🚚 Langkah Delivery Lengkap</h4>
              <p class="text-sm text-blue-700 mb-2">[TAMBAHKAN SS ANTRIAN KURIR DELIVERY]</p>
              <ol class="text-sm text-blue-700 space-y-1">
                <li>1. Pilih "Delivery" di dashboard kurir</li>
                <li>2. Klik "Buka Antrian" untuk masuk ke antrian delivery</li>
                <li>3. Lihat customer yang perlu diantar (grouping otomatis)</li>
                <li>4. Kirim WhatsApp notifikasi ke customer</li>
                <li>5. Copy alamat untuk navigasi</li>
                <li>6. Lihat detail item customer (klik tombol "i")</li>
                <li>7. Pergi ke alamat customer</li>
                <li>8. Serahkan sepatu ke customer</li>
                <li>9. Upload foto sebagai bukti delivery</li>
                <li>10. Klik "Selesai" untuk menyelesaikan delivery</li>
              </ol>
            </div>
            
            <div class="bg-green-50 p-4 rounded-lg">
              <h4 class="font-semibold text-green-800 mb-2">📱 WhatsApp & Komunikasi</h4>
              <p class="text-sm text-green-700 mb-2">Fitur komunikasi dengan customer:</p>
              <ul class="text-sm text-green-700 space-y-1">
                <li>• <strong>Tombol WhatsApp:</strong> Hijau dengan icon WhatsApp</li>
                <li>• <strong>Template Pesan:</strong> Notifikasi akan mengantar sepatu</li>
                <li>• <strong>Format Nomor:</strong> Otomatis jadi 62xx</li>
                <li>• <strong>Konfirmasi:</strong> Pastikan customer siap menerima</li>
              </ul>
            </div>
            
            <div class="bg-yellow-50 p-4 rounded-lg">
              <h4 class="font-semibold text-yellow-800 mb-2">🗺️ Navigasi & Detail</h4>
              <p class="text-sm text-yellow-700 mb-2">Fitur navigasi dan informasi:</p>
              <ul class="text-sm text-yellow-700 space-y-1">
                <li>• <strong>Copy Address:</strong> Copy alamat ke clipboard</li>
                <li>• <strong>Detail Item:</strong> Lihat brand, treatment, status</li>
                <li>• <strong>Customer Grouping:</strong> Multiple item jadi satu card</li>
                <li>• <strong>Search:</strong> Cari customer berdasarkan nama/alamat</li>
              </ul>
            </div>
            
            <div class="bg-purple-50 p-4 rounded-lg">
              <h4 class="font-semibold text-purple-800 mb-2">📸 Dokumentasi Wajib</h4>
              <ul class="text-sm text-purple-700 space-y-1">
                <li>• Foto sepatu yang diantar</li>
                <li>• Foto customer menerima sepatu</li>
                <li>• Foto sebagai bukti transparan</li>
                <li>• Data waktu delivery tersimpan otomatis</li>
              </ul>
            </div>
          </div>
        `
      },
    },
    sistem: {
      whatsapp: {
        title: 'Setup WhatsApp',
        description: 'Konfigurasi notifikasi WhatsApp',
        icon: FaWhatsapp,
        content: `
          <h3 class="text-lg font-bold mb-4">Setup WhatsApp</h3>
          <p class="mb-4">WhatsApp digunakan untuk mengirim notifikasi ke customer secara otomatis.</p>
          
          <div class="space-y-4">
            <div class="bg-blue-50 p-4 rounded-lg">
              <h4 class="font-semibold text-blue-800 mb-2">📱 Langkah Setup</h4>
              <p class="text-sm text-blue-700 mb-2">[TAMBAHKAN SS WA SETUP]</p>
              <ol class="text-sm text-blue-700 space-y-1">
                <li>1. Masuk ke menu "Pengaturan WhatsApp"</li>
                <li>2. Pilih cabang yang akan disetup (untuk Owner)</li>
                <li>3. Klik "Buat Session Baru"</li>
                <li>4. Scan QR Code dengan WhatsApp</li>
                <li>5. Tunggu sampai status "Connected"</li>
                <li>6. Test dengan kirim pesan percobaan</li>
              </ol>
            </div>
            
            <div class="bg-green-50 p-4 rounded-lg">
              <h4 class="font-semibold text-green-800 mb-2">✅ Status Koneksi</h4>
              <ul class="text-sm text-green-700 space-y-1">
                <li>• <strong>Connected:</strong> WhatsApp sudah terhubung</li>
                <li>• <strong>Disconnected:</strong> WhatsApp terputus</li>
                <li>• <strong>Connecting:</strong> Sedang menghubungkan</li>
                <li>• <strong>QR Code:</strong> Perlu scan QR code</li>
              </ul>
            </div>
            
            <div class="bg-yellow-50 p-4 rounded-lg">
              <h4 class="font-semibold text-yellow-800 mb-2">💬 Notifikasi Otomatis</h4>
              <p class="text-sm text-yellow-700 mb-2">WhatsApp akan mengirim notifikasi untuk:</p>
              <ul class="text-sm text-yellow-700 space-y-1">
                <li>• Konfirmasi pesanan diterima</li>
                <li>• Update status pengerjaan</li>
                <li>• Notifikasi siap diambil/diantar</li>
                <li>• Reminder pembayaran</li>
              </ul>
            </div>
          </div>
        `
      },
      printer: {
        title: 'Setup Printer',
        description: 'Konfigurasi printer thermal',
        icon: FaPrint,
        content: `
          <h3 class="text-lg font-bold mb-4">Setup Printer Thermal</h3>
          <p class="mb-4">Konfigurasi printer untuk mencetak struk dan label:</p>
          
          <div class="space-y-4">
            <div class="bg-blue-50 p-4 rounded-lg">
              <h4 class="font-semibold text-blue-800 mb-2">🔧 Langkah-langkah Setup</h4>
              <ol class="text-sm text-blue-700 space-y-1">
                <li>1. Masuk ke menu "Pengaturan Printer"</li>
                <li>2. Klik "Tambah Printer"</li>
                <li>3. Isi nama printer</li>
                <li>4. Masukkan IP address printer</li>
                <li>5. Test print</li>
              </ol>
            </div>
            
            <div class="bg-green-50 p-4 rounded-lg">
              <h4 class="font-semibold text-green-800 mb-2">📄 Yang Bisa Dicetak</h4>
              <ul class="text-sm text-green-700 space-y-1">
                <li>• Struk transaksi</li>
                <li>• Kwitansi pembayaran</li>
                <li>• Label pesanan</li>
                <li>• Laporan harian</li>
                <li>• Label pelanggan</li>
              </ul>
            </div>
            
            <div class="bg-red-50 p-4 rounded-lg">
              <h4 class="font-semibold text-red-800 mb-2">❌ Troubleshooting</h4>
              <ul class="text-sm text-red-700 space-y-1">
                <li>• Pastikan printer terhubung WiFi</li>
                <li>• Cek IP address printer</li>
                <li>• Restart printer jika error</li>
                <li>• Ganti kertas jika habis</li>
              </ul>
            </div>
          </div>
        `
      }
    }
  };

  const category = panduanData[categoryId];
  const item = category?.[itemId];
  
  if (!item) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-lg font-semibold font-bold text-gray-900 font-montserrat mb-4">
            Materi Tidak Ditemukan
          </h1>
          <AnimatedButton onClick={() => navigate('/panduan')}>
            Kembali ke Panduan
          </AnimatedButton>
        </div>
      </div>
    );
  }

  const Icon = item.icon;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(`/panduan/${categoryId}`)}
              className="p-2 rounded-full hover:bg-gray-100 transition-colors"
              title="Kembali"
            >
              <FaArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div className="p-3 rounded-xl bg-blue-50 border border-blue-200">
              <Icon className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-lg font-semibold font-bold text-gray-900 font-montserrat">
                {item.title}
              </h1>
              <p className="text-gray-600 font-montserrat">
                {item.description}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="bg-white rounded-xl p-8 shadow-sm">
          <div 
            className="prose prose-lg max-w-none font-montserrat"
            dangerouslySetInnerHTML={{ __html: item.content }}
          />
        </div>

        {/* Navigation */}
        <div className="mt-8 flex justify-between">
          <AnimatedButton
            variant="outline"
            onClick={() => navigate(`/panduan/${categoryId}`)}
          >
            ← Kembali ke Kategori
          </AnimatedButton>
          
          <AnimatedButton
            variant="outline"
            onClick={() => navigate('/panduan')}
          >
            Kembali ke Daftar Panduan
          </AnimatedButton>
        </div>
      </div>
    </div>
  );
};

export default PanduanDetail;
