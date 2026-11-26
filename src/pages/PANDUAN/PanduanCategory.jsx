import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FaArrowLeft, FaUsers, FaCogs, FaTruck, FaCashRegister, FaBuilding, FaCog } from 'react-icons/fa';
import AnimatedButton from '../../components/Design/AnimatedButton';

const PanduanCategory = () => {
  const navigate = useNavigate();
  const { categoryId } = useParams();

  const panduanData = {
    owner: {
      title: 'Panduan Owner',
      description: 'Cara mengelola bisnis laundry secara keseluruhan',
      icon: FaBuilding,
      color: 'blue',
      items: [
        { 
          id: 'dashboard', 
          title: 'Dashboard Owner', 
          description: 'Memahami beranda dan 10 menu manajemen bisnis',
          content: 'Dashboard owner adalah pusat kontrol untuk mengelola bisnis laundry Anda dengan 10 menu utama.'
        },
        { 
          id: 'data-tenant', 
          title: 'Data Tenant', 
          description: 'Kelola data tenant dan informasi bisnis',
          content: 'Kelola informasi bisnis, profil perusahaan, dan data tenant utama.'
        },
        { 
          id: 'manajemen-cabang', 
          title: 'Manajemen Cabang', 
          description: 'Kelola cabang-cabang bisnis Anda',
          content: 'Tambah, edit, dan kelola cabang-cabang bisnis laundry Anda.'
        },
        { 
          id: 'manajemen-karyawan', 
          title: 'Manajemen Karyawan', 
          description: 'Kelola data dan absensi karyawan',
          content: 'Kelola data karyawan, role, absensi, dan performa tim.'
        },
        { 
          id: 'manajemen-treatment', 
          title: 'Manajemen Treatment', 
          description: 'Kelola treatment dan layanan',
          content: 'Atur layanan cuci, harga, waktu pengerjaan, dan paket treatment.'
        },
        { 
          id: 'manajemen-discount', 
          title: 'Manajemen Discount', 
          description: 'Kelola discount dan promo',
          content: 'Buat dan kelola diskon, promo, dan program loyalitas customer.'
        },
        { 
          id: 'manajemen-customer', 
          title: 'Manajemen Customer', 
          description: 'Kelola data customer dan kontak',
          content: 'Kelola database customer, riwayat transaksi, dan komunikasi.'
        },
        { 
          id: 'manajemen-finance', 
          title: 'Manajemen Finance', 
          description: 'Kelola akun keuangan dan transaksi',
          content: 'Kelola keuangan bisnis, akun bank, dan laporan finansial.'
        },
        { 
          id: 'manajemen-shift', 
          title: 'Manajemen Shift', 
          description: 'Lihat history shift karyawan',
          content: 'Monitor jam kerja karyawan, shift, dan produktivitas tim.'
        },
        { 
          id: 'manajemen-printer', 
          title: 'Manajemen Printer', 
          description: 'Kelola printer dan koneksi Bluetooth',
          content: 'Konfigurasi printer thermal, Bluetooth, dan sistem cetak struk.'
        },
        { 
          id: 'pengaturan-whatsapp', 
          title: 'Pengaturan WhatsApp', 
          description: 'Konfigurasi WhatsApp per cabang',
          content: 'Setup WhatsApp Business API untuk notifikasi otomatis ke customer.'
        }
      ]
    },
    'admin-kasir': {
      title: 'Panduan Admin/Kasir',
      description: 'Cara mengelola operasional harian dan transaksi',
      icon: FaUsers,
      color: 'green',
      items: [
        { 
          id: 'dashboard-admin-kasir', 
          title: 'Dashboard Admin/Kasir', 
          description: 'Beranda admin/kasir dengan date range dan statistik',
          content: 'Dashboard admin/kasir menampilkan informasi operasional harian dan statistik transaksi.'
        },
        { 
          id: 'antrian-admin-kasir', 
          title: 'Antrian Admin/Kasir', 
          description: 'Mengelola antrian QC dan pembayaran dengan search',
          content: 'Kelola antrian QC dan pembayaran dengan fitur search dan filter.'
        },
        { 
          id: 'quality-control', 
          title: 'Quality Control', 
          description: 'Cek kualitas cucian dan keputusan QC',
          content: 'Cek kualitas cucian dan memutuskan lolos atau tidak lolos QC.'
        },
        { 
          id: 'proses-pembayaran', 
          title: 'Proses Pembayaran', 
          description: 'Handle pembayaran dan cetak struk',
          content: 'Handle pembayaran customer dan cetak struk transaksi.'
        },
        { 
          id: 'pengaturan-admin', 
          title: 'Lainnya', 
          description: 'Kelola pengaturan terbatas cabang',
          content: 'Kelola pengaturan terbatas cabang seperti treatment, discount, customer, printer, dan WhatsApp.'
        }
      ]
    },
    teknisi: {
      title: 'Panduan Teknisi',
      description: 'Cara memproses pesanan laundry',
      icon: FaCogs,
      color: 'yellow',
      items: [
        { 
          id: 'dashboard-teknisi', 
          title: 'Dashboard Teknisi', 
          description: 'Beranda teknisi dan daftar tugas',
          content: 'Dashboard teknisi menampilkan daftar tugas dan pesanan yang perlu diproses.'
        },
        { 
          id: 'proses-cuci', 
          title: 'Proses Pencucian', 
          description: 'Langkah-langkah proses laundry',
          content: 'Pelajari langkah-langkah proses pencucian yang benar dan efisien.'
        },
        { 
          id: 'update-status', 
          title: 'Update Status', 
          description: 'Mengupdate status pesanan',
          content: 'Cara mengupdate status pesanan dari proses hingga selesai.'
        },
        { 
          id: 'quality-control', 
          title: 'Quality Control', 
          description: 'Memastikan kualitas hasil cucian',
          content: 'Standar kualitas dan cara memastikan hasil cucian memenuhi standar.'
        }
      ]
    },
    kurir: {
      title: 'Panduan Kurir',
      description: 'Cara mengantarkan pesanan ke pelanggan',
      icon: FaTruck,
      color: 'orange',
      items: [
        { 
          id: 'dashboard-kurir', 
          title: 'Dashboard Kurir', 
          description: 'Beranda kurir dengan date range dan counter antrian',
          content: 'Dashboard kurir adalah pusat kontrol untuk pekerjaan pickup dan delivery dengan fitur date range picker.'
        },
        { 
          id: 'antrian-kurir', 
          title: 'Antrian Kurir', 
          description: 'Mengelola antrian pickup dan delivery dengan search',
          content: 'Halaman antrian kurir untuk mengelola pickup dan delivery dengan fitur search dan customer grouping.'
        },
        { 
          id: 'proses-pickup', 
          title: 'Proses Pickup', 
          description: 'Cara menjemput laundry dari customer',
          content: 'Pickup adalah proses menjemput sepatu dari customer untuk dicuci.'
        },
        { 
          id: 'proses-delivery', 
          title: 'Proses Delivery', 
          description: 'Cara mengantar laundry ke customer',
          content: 'Delivery adalah proses mengantar sepatu yang sudah dicuci ke customer.'
        }
      ]
    },
    sistem: {
      title: 'Panduan Sistem',
      description: 'Konfigurasi teknis dan integrasi',
      icon: FaCog,
      color: 'gray',
      items: [
        { 
          id: 'whatsapp', 
          title: 'Setup WhatsApp', 
          description: 'Konfigurasi notifikasi WhatsApp',
          content: 'Cara mengkonfigurasi WhatsApp untuk notifikasi otomatis ke pelanggan.'
        },
        { 
          id: 'printer', 
          title: 'Setup Printer', 
          description: 'Konfigurasi printer thermal',
          content: 'Konfigurasi printer thermal untuk mencetak struk dan label.'
        },
        { 
          id: 'backup', 
          title: 'Backup Data', 
          description: 'Cara backup dan restore data',
          content: 'Prosedur backup data penting dan cara restore jika diperlukan.'
        },
        { 
          id: 'troubleshooting', 
          title: 'Troubleshooting', 
          description: 'Mengatasi masalah umum',
          content: 'Solusi untuk masalah umum yang mungkin terjadi dalam sistem.'
        }
      ]
    }
  };

  const category = panduanData[categoryId];
  
  if (!category) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-lg font-semibold font-bold text-gray-900 font-montserrat mb-4">
            Kategori Tidak Ditemukan
          </h1>
          <AnimatedButton onClick={() => navigate('/panduan')}>
            Kembali ke Panduan
          </AnimatedButton>
        </div>
      </div>
    );
  }

  const Icon = category.icon;

  const getColorClasses = (color) => {
    const colors = {
      blue: 'bg-blue-50 border-blue-200 text-blue-800',
      green: 'bg-green-50 border-green-200 text-green-800',
      yellow: 'bg-yellow-50 border-yellow-200 text-yellow-800',
      purple: 'bg-purple-50 border-purple-200 text-purple-800',
      orange: 'bg-orange-50 border-orange-200 text-orange-800',
      gray: 'bg-gray-50 border-gray-200 text-gray-800'
    };
    return colors[color] || colors.gray;
  };

  const getIconColorClasses = (color) => {
    const colors = {
      blue: 'text-blue-600',
      green: 'text-green-600',
      yellow: 'text-yellow-600',
      purple: 'text-purple-600',
      orange: 'text-orange-600',
      gray: 'text-gray-600'
    };
    return colors[color] || colors.gray;
  };

  const handleItemClick = (itemId) => {
    navigate(`/panduan/${categoryId}/${itemId}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/panduan')}
              className="p-2 rounded-full hover:bg-gray-100 transition-colors"
              title="Kembali"
            >
              <FaArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div className={`p-3 rounded-xl ${getColorClasses(category.color)}`}>
              <Icon className={`w-6 h-6 ${getIconColorClasses(category.color)}`} />
            </div>
            <div>
              <h1 className="text-lg font-semibold font-bold text-gray-900 font-montserrat">
                {category.title}
              </h1>
              <p className="text-gray-600 font-montserrat">
                {category.description}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {category.items.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => handleItemClick(item.id)}
            >
              <h3 className="text-lg font-bold text-gray-900 font-montserrat mb-2">
                {item.title}
              </h3>
              <p className="text-gray-600 font-montserrat mb-4">
                {item.description}
              </p>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500 font-montserrat">
                  Klik untuk melihat detail
                </span>
                <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
              </div>
            </div>
          ))}
        </div>

        {/* Back Button */}
        <div className="mt-8 text-center">
          <AnimatedButton
            variant="outline"
            onClick={() => navigate('/panduan')}
            className="px-8"
          >
            Kembali ke Daftar Panduan
          </AnimatedButton>
        </div>
      </div>
    </div>
  );
};

export default PanduanCategory;
