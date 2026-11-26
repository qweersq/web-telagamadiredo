import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaUsers, FaCogs, FaTruck, FaCashRegister, FaBuilding, FaWhatsapp, FaPrint, FaChartBar, FaCog } from 'react-icons/fa';
import AnimatedButton from '../../components/Design/AnimatedButton';
import { useCurrentUserRole } from '../../utils/roleValidator';

const PanduanIndex = () => {
  const navigate = useNavigate();
  const { userRole, loading } = useCurrentUserRole();

  const panduanCategories = [
    {
      id: 'owner',
      title: 'Panduan Owner',
      description: 'Cara mengelola bisnis laundry secara keseluruhan',
      icon: FaBuilding,
      color: 'blue',
      items: [
        { id: 'dashboard', title: 'Dashboard Owner', description: 'Memahami beranda dan 10 menu manajemen bisnis' },
        { id: 'data-tenant', title: 'Data Tenant', description: 'Kelola data tenant dan informasi bisnis' },
        { id: 'manajemen-cabang', title: 'Manajemen Cabang', description: 'Kelola cabang-cabang bisnis Anda' },
        { id: 'manajemen-karyawan', title: 'Manajemen Karyawan', description: 'Kelola data dan absensi karyawan' },
        { id: 'manajemen-treatment', title: 'Manajemen Treatment', description: 'Kelola treatment dan layanan' },
        { id: 'manajemen-discount', title: 'Manajemen Discount', description: 'Kelola discount dan promo' },
        { id: 'manajemen-customer', title: 'Manajemen Customer', description: 'Kelola data customer dan kontak' },
        { id: 'manajemen-finance', title: 'Manajemen Finance', description: 'Kelola akun keuangan dan transaksi' },
        { id: 'manajemen-shift', title: 'Manajemen Shift', description: 'Lihat history shift karyawan' },
        { id: 'manajemen-printer', title: 'Manajemen Printer', description: 'Kelola printer dan koneksi Bluetooth' },
        { id: 'pengaturan-whatsapp', title: 'Pengaturan WhatsApp', description: 'Konfigurasi WhatsApp per cabang' }
      ]
    },
    {
      id: 'admin-kasir',
      title: 'Panduan Admin/Kasir',
      description: 'Cara mengelola operasional harian dan transaksi',
      icon: FaUsers,
      color: 'green',
      items: [
        { id: 'dashboard-admin-kasir', title: 'Dashboard Admin/Kasir', description: 'Beranda admin/kasir dengan date range dan statistik' },
        { id: 'antrian-admin-kasir', title: 'Antrian Admin/Kasir', description: 'Mengelola antrian QC dan pembayaran dengan search' },
        { id: 'quality-control', title: 'Quality Control', description: 'Cek kualitas cucian dan keputusan QC' },
        { id: 'proses-pembayaran', title: 'Proses Pembayaran', description: 'Handle pembayaran dan cetak struk' },
        { id: 'pengaturan-admin', title: 'Pengaturan Admin', description: 'Kelola pengaturan terbatas cabang' }
      ]
    },
    {
      id: 'teknisi',
      title: 'Panduan Teknisi',
      description: 'Cara memproses pesanan laundry',
      icon: FaCogs,
      color: 'yellow',
      items: [
        { id: 'dashboard-teknisi', title: 'Dashboard Teknisi', description: 'Beranda teknisi dan daftar tugas' },
        { id: 'antrian-teknisi', title: 'Antrian Teknisi', description: 'Mengakses dan mengelola antrian cuci' },
        { id: 'mulai-treatment', title: 'Memulai Treatment', description: 'Cara memulai proses pencucian' },
        { id: 'timer-tracking', title: 'Timer Tracking', description: 'Menggunakan timer untuk tracking waktu' },
        { id: 'dokumentasi-foto', title: 'Dokumentasi Foto', description: 'Cara upload foto dokumentasi' },
        { id: 'update-status', title: 'Update Status', description: 'Mengupdate status pengerjaan' },
        { id: 'handle-qc-failed', title: 'Handle QC Failed', description: 'Menangani item yang tidak lolos QC' }
      ]
    },
    {
      id: 'kurir',
      title: 'Panduan Kurir',
      description: 'Cara mengantarkan pesanan ke pelanggan',
      icon: FaTruck,
      color: 'orange',
      items: [
        { id: 'dashboard-kurir', title: 'Dashboard Kurir', description: 'Beranda kurir dengan date range dan counter antrian' },
        { id: 'antrian-kurir', title: 'Antrian Kurir', description: 'Mengelola antrian pickup dan delivery dengan search' },
        { id: 'proses-pickup', title: 'Proses Pickup', description: 'Cara menjemput laundry dari customer' },
        { id: 'proses-delivery', title: 'Proses Delivery', description: 'Cara mengantar laundry ke customer' }
      ]
    },
    {
      id: 'sistem',
      title: 'Panduan Sistem',
      description: 'Konfigurasi teknis dan integrasi',
      icon: FaCog,
      color: 'gray',
      items: [
        { id: 'whatsapp-setup', title: 'Setup WhatsApp', description: 'Konfigurasi WhatsApp per cabang' },
        { id: 'printer-setup', title: 'Setup Printer', description: 'Konfigurasi printer Bluetooth' },
        { id: 'troubleshooting', title: 'Troubleshooting', description: 'Mengatasi masalah sistem umum' },
        { id: 'backup-data', title: 'Backup Data', description: 'Membuat cadangan data penting' },
        { id: 'keamanan-sistem', title: 'Keamanan Sistem', description: 'Pengaturan password dan role' }
      ]
    }
  ];

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

  const handleCategoryClick = (categoryId) => {
    navigate(`/panduan/${categoryId}`);
  };

  const handleItemClick = (categoryId, itemId) => {
    navigate(`/panduan/${categoryId}/${itemId}`);
  };

  // Filter categories based on user role
  const getFilteredCategories = () => {
    if (loading) return [];
    
    switch(userRole) {
      case 'superadmin':
        return panduanCategories; // All categories
      case 'admin':
        return panduanCategories.filter(cat => cat.id !== 'owner'); // No owner category
      case 'employee':
        return panduanCategories.filter(cat => 
          ['teknisi', 'kasir', 'kurir'].includes(cat.id)
        ); // Only operational roles
      default:
        return panduanCategories.filter(cat => cat.id === 'teknisi'); // Default to teknisi
    }
  };

  const filteredCategories = getFilteredCategories();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate("/berandaowner")}
              className="p-2 rounded-full hover:bg-gray-100 transition-colors"
              title="Kembali"
            >
              <FaArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-lg font-semibold font-bold text-gray-900 font-montserrat">
                Panduan Penggunaan
              </h1>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
              <p className="mt-4 text-gray-600 font-montserrat">Memuat panduan...</p>
            </div>
          </div>
        ) : filteredCategories.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <p className="text-gray-600 font-montserrat">Tidak ada panduan yang tersedia untuk role Anda.</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCategories.map((category) => {
            const Icon = category.icon;
            return (
              <div
                key={category.id}
                className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => handleCategoryClick(category.id)}
              >
                <div className="flex items-start gap-4 mb-4">
                  <div className={`p-3 rounded-xl ${getColorClasses(category.color)}`}>
                    <Icon className={`w-6 h-6 ${getIconColorClasses(category.color)}`} />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-900 font-montserrat mb-1">
                      {category.title}
                    </h3>
                    <p className="text-sm text-gray-600 font-montserrat">
                      {category.description}
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  {category.items.slice(0, 3).map((item) => (
                    <div
                      key={item.id}
                      className="p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleItemClick(category.id, item.id);
                      }}
                    >
                      <h4 className="text-sm font-semibold text-gray-800 font-montserrat mb-1">
                        {item.title}
                      </h4>
                      <p className="text-xs text-gray-600 font-montserrat">
                        {item.description}
                      </p>
                    </div>
                  ))}
                  
                  {category.items.length > 3 && (
                    <div className="text-center pt-2">
                      <span className="text-xs text-gray-500 font-montserrat">
                        +{category.items.length - 3} materi lainnya
                      </span>
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-4 border-t border-gray-200">
                  <AnimatedButton
                    variant="outline"
                    className="w-full text-sm font-montserrat"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCategoryClick(category.id);
                    }}
                  >
                    Lihat Semua Materi
                  </AnimatedButton>
                </div>
              </div>
            );
          })}
          </div>
        )}

        {/* Quick Access - Only show if not loading and has categories */}
        {!loading && filteredCategories.length > 0 && (
          <div className="mt-8 bg-white rounded-xl p-6 shadow-sm">
            <h2 className="text-xl font-bold text-gray-900 font-montserrat mb-4">
              🚀 Akses Cepat
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Only show system-related quick access for superadmin and admin */}
              {(userRole === 'superadmin' || userRole === 'admin') && (
                <>
                  <button
                    onClick={() => navigate('/panduan/sistem/whatsapp')}
                    className="p-4 rounded-lg bg-green-50 border border-green-200 hover:bg-green-100 transition-colors text-left"
                  >
                    <FaWhatsapp className="w-6 h-6 text-green-600 mb-2" />
                    <h3 className="font-semibold text-green-800 font-montserrat">Setup WhatsApp</h3>
                    <p className="text-xs text-green-600 font-montserrat">Konfigurasi notifikasi</p>
                  </button>
                  
                  <button
                    onClick={() => navigate('/panduan/sistem/printer')}
                    className="p-4 rounded-lg bg-blue-50 border border-blue-200 hover:bg-blue-100 transition-colors text-left"
                  >
                    <FaPrint className="w-6 h-6 text-blue-600 mb-2" />
                    <h3 className="font-semibold text-blue-800 font-montserrat">Setup Printer</h3>
                    <p className="text-xs text-blue-600 font-montserrat">Konfigurasi printer</p>
                  </button>
                  
                  <button
                    onClick={() => navigate('/panduan/sistem/troubleshooting')}
                    className="p-4 rounded-lg bg-red-50 border border-red-200 hover:bg-red-100 transition-colors text-left"
                  >
                    <FaCog className="w-6 h-6 text-red-600 mb-2" />
                    <h3 className="font-semibold text-red-800 font-montserrat">Troubleshooting</h3>
                    <p className="text-xs text-red-600 font-montserrat">Mengatasi masalah</p>
                  </button>
                </>
              )}
              
              {/* Only show laporan for superadmin */}
              {userRole === 'superadmin' && (
                <button
                  onClick={() => navigate('/panduan/owner/laporan')}
                  className="p-4 rounded-lg bg-purple-50 border border-purple-200 hover:bg-purple-100 transition-colors text-left"
                >
                  <FaChartBar className="w-6 h-6 text-purple-600 mb-2" />
                  <h3 className="font-semibold text-purple-800 font-montserrat">Laporan</h3>
                  <p className="text-xs text-purple-600 font-montserrat">Analisis bisnis</p>
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PanduanIndex;
