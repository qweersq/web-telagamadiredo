import React from 'react';
import AnimatedButton from '../Design/AnimatedButton';

const RoleExplanationModal = ({ isOpen, onClose, onConfirm, selectedRole }) => {
  if (!isOpen) return null;

  const getRoleExplanation = (role) => {
    switch (role) {
      case 'staff':
        return {
          title: 'Peran Staff',
          icon: (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8 text-telaga-600">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z" />
            </svg>
          ),
          description: 'Staff adalah karyawan lapangan Telaga Madiredo — kebersihan, dapur, taman, dan keamanan. Fokus pada kehadiran dan tugas harian.',
          responsibilities: [
            {
              title: 'Absensi Harian',
              description: 'Absen masuk saat mulai bekerja dan absen pulang saat selesai',
              icon: '⏰'
            },
            {
              title: 'Tugas Harian',
              description: 'Menyelesaikan daftar tugas yang diberikan supervisor hari itu',
              icon: '📋'
            },
            {
              title: 'Lapor Kondisi Lapangan',
              description: 'Melaporkan kerusakan atau temuan di area kerja ke supervisor',
              icon: '📣'
            }
          ]
        };

      case 'teknisi':
        return {
          title: 'Peran Petugas Tiket',
          icon: (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8 text-telaga-600">
              <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 004.486-6.336l-3.276 3.277a3.004 3.004 0 01-2.25-2.25l3.276-3.276a4.5 4.5 0 00-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437l1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008z" />
            </svg>
          ),
          description: 'Petugas Tiket bertanggung jawab memeriksa dan memvalidasi tiket pengunjung di pintu masuk kawasan.',
          responsibilities: [
            {
              title: 'Validasi Tiket',
              description: 'Memindai atau memeriksa kode tiket pengunjung saat masuk kawasan',
              icon: '🔄'
            },
            {
              title: 'Hitung Pengunjung',
              description: 'Mencatat jumlah pengunjung sesuai tiket yang divalidasi',
              icon: '🧽'
            },
            {
              title: 'Check-in Rombongan',
              description: 'Menandai kedatangan rombongan sekolah, kantor, atau keluarga besar',
              icon: '🌪️'
            },
            {
              title: 'Bantuan Pengunjung',
              description: 'Mengarahkan pengunjung ke area telaga, resto, dan fasilitas lain',
              icon: '✅'
            }
          ]
        };
      
      case 'kurir':
        return {
          title: 'Peran Petugas Wahana',
          icon: (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8 text-senja-500">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
            </svg>
          ),
          description: 'Petugas Wahana mengurus operasional perahu, pelampung, dan area air agar aman serta tertib.',
          responsibilities: [
            {
              title: 'Sewa Perahu',
              description: 'Mengatur antrian dan penyewaan perahu keliling telaga',
              icon: '📦'
            },
            {
              title: 'Peminjaman Pelampung',
              description: 'Membagikan pelampung dan memastikan jumlahnya kembali lengkap',
              icon: '🚚'
            },
            {
              title: 'Keselamatan Pengunjung',
              description: 'Memastikan semua pengunjung, terutama anak, memakai pelampung',
              icon: '🤝'
            },
            {
              title: 'Update Status',
              description: 'Mencatat pemakaian wahana dan area air di sistem',
              icon: '📱'
            }
          ]
        };
      
      case 'admin':
        return {
          title: 'Peran Admin',
          icon: (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8 text-telaga-600">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
            </svg>
          ),
          description: 'Admin bertanggung jawab atas penjualan tiket masuk, kasir loket, dan rekap transaksi harian.',
          responsibilities: [
            {
              title: 'Penjualan Tiket',
              description: 'Memproses pembelian tiket masuk tunai maupun QRIS di loket',
              icon: '📋'
            },
            {
              title: 'Manajemen Pengunjung',
              description: 'Mendaftarkan data pengunjung dan rombongan',
              icon: '👥'
            },
            {
              title: 'Kelola Harga & Diskon',
              description: 'Mengatur tarif weekday, weekend, serta promo rombongan',
              icon: '🏷️'
            },
            {
              title: 'Pengelolaan Shift',
              description: 'Membuka dan menutup shift operasional',
              icon: '⏰'
            },
            {
              title: 'Koordinasi Tim',
              description: 'Mengatur jadwal dan koordinasi antar peran di lapangan',
              icon: '🎯'
            }
          ]
        };
      
      case 'qc':
        return {
          title: 'Peran Pemeriksa Area',
          icon: (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8 text-senja-500">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ),
          description: 'Pemeriksa Area memastikan kebersihan, keamanan, dan kelayakan fasilitas di kawasan wisata.',
          responsibilities: [
            {
              title: 'Pemeriksaan Fasilitas',
              description: 'Memeriksa kolam, gazebo, toilet, dan area bermain',
              icon: '🔍'
            },
            {
              title: 'Update Status Area',
              description: 'Menandai area yang siap dipakai atau perlu perbaikan',
              icon: '✅'
            },
            {
              title: 'Kebersihan Harian',
              description: 'Mengawasi kebersihan area setelah jam ramai pengunjung',
              icon: '🏪'
            },
            {
              title: 'Laporan Akhir Shift',
              description: 'Melaporkan temuan dan kondisi area ke supervisor',
              icon: '🎯'
            }
          ]
        };
      
      case 'dapur':
        return {
          title: 'Peran Dapur',
          icon: (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8 text-senja-600">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 9a3 3 0 015.4-1.8 3.75 3.75 0 014.2 0A3 3 0 0119.5 9a3 3 0 01-1.8 2.73V18a1.5 1.5 0 01-1.5 1.5H7.8A1.5 1.5 0 016.3 18v-6.27A3 3 0 014.5 9z" />
            </svg>
          ),
          description: 'Dapur adalah layar kerja penyiapan pesanan cafe & resto. Semua pesanan yang harus dibuat di dapur ini muncul otomatis, termasuk pesanan dari outlet lain yang dipusatkan ke sini.',
          responsibilities: [
            {
              title: 'Lihat Antrian Pesanan',
              description: 'Pesanan baru masuk otomatis ke daftar beserta nomor antrian dan detail opsinya',
              icon: '🧾'
            },
            {
              title: 'Tandai Sedang Dibuat',
              description: 'Tekan Mulai saat mulai mengerjakan agar kasir tahu pesanan sudah diproses',
              icon: '🔥'
            },
            {
              title: 'Selesaikan Pesanan',
              description: 'Tekan Selesai supaya pesanan siap disajikan atau diambil pelanggan',
              icon: '✅'
            },
            {
              title: 'Cetak Ulang Tiket',
              description: 'Cetak ulang tiket dapur ke printer thermal bila kertasnya hilang atau rusak',
              icon: '🖨️'
            }
          ]
        };

      case 'owner':
        return {
          title: 'Peran Pengelola',
          icon: (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8 text-telaga-700">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
            </svg>
          ),
          description: 'Pengelola bertanggung jawab atas manajemen bisnis Telaga Madiredo secara keseluruhan dan analisis performa.',
          responsibilities: [
            {
              title: 'Manajemen Unit',
              description: 'Mengelola dan mengawasi operasional seluruh unit usaha',
              icon: '🏢'
            },
            {
              title: 'Manajemen Karyawan',
              description: 'Mengatur dan mengawasi kinerja seluruh tim karyawan',
              icon: '👥'
            },
            {
              title: 'Analisis Laporan',
              description: 'Melihat dan menganalisis laporan keuangan, penjualan, dan performa bisnis',
              icon: '📊'
            },
            {
              title: 'Strategi Bisnis',
              description: 'Merencanakan dan mengembangkan strategi bisnis jangka panjang',
              icon: '🎯'
            },
            {
              title: 'Kontrol Keuangan',
              description: 'Mengawasi arus kas, profitabilitas, dan pengaturan lainnya',
              icon: '💰'
            },
            {
              title: 'Pengambilan Keputusan',
              description: 'Data digunakan untuk pengambilan keputusan strategis bisnis',
              icon: '⚖️'
            }
          ]
        };
      
      case 'supervisor':
        return {
          title: 'Peran Supervisor',
          icon: (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8 text-senja-600">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ),
          description: 'Supervisor mengawasi operasional seluruh unit di Telaga Madiredo, dengan menu kerja seperti kasir.',
          responsibilities: [
            {
              title: 'Pengawasan Semua Unit',
              description: 'Memantau dan menilai operasional tiap unit usaha',
              icon: '🏢'
            },
            {
              title: 'Pindah Loket',
              description: 'Bebas berpindah loket untuk mengecek kondisi lapangan',
              icon: '🔄'
            },
            {
              title: 'Operasional Harian',
              description: 'Mengikuti alur kerja kasir: tiket, pengunjung, dan shift',
              icon: '📋'
            }
          ]
        };

      case 'superapp-admin':
        return {
          title: 'Peran Admin Sistem',
          icon: (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8 text-telaga-800">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15l-1.5 18h-12L4.5 3zM9 9h6m-6 4h6m-6 4h6" />
            </svg>
          ),
          description: 'Admin Sistem bertanggung jawab mengelola semua unit usaha dan konfigurasi platform.',
          responsibilities: [
            {
              title: 'Manajemen Unit',
              description: 'Mengelola dan mengawasi semua unit usaha yang terdaftar',
              icon: '🏢'
            },
            {
              title: 'Sistem Langganan',
              description: 'Mengatur paket langganan, harga, dan fitur untuk setiap unit usaha',
              icon: '💳'
            },
            {
              title: 'Monitoring Platform',
              description: 'Memantau performa platform secara keseluruhan dan kesehatan sistem',
              icon: '📊'
            },
            {
              title: 'Dukungan Teknis',
              description: 'Memberikan dukungan teknis dan menyelesaikan masalah operasional',
              icon: '🛠️'
            },
            {
              title: 'Analisis Bisnis',
              description: 'Menganalisis data bisnis platform dan memberikan insight untuk pengembangan',
              icon: '📈'
            },
            {
              title: 'Manajemen Pengguna',
              description: 'Mengelola akses dan hak pengguna di level platform tertinggi',
              icon: '👑'
            },
            {
              title: 'Konfigurasi Sistem',
              description: 'Mengatur konfigurasi sistem yang mempengaruhi semua unit usaha',
              icon: '⚙️'
            },
            {
              title: 'Laporan Platform',
              description: 'Membuat dan menganalisis laporan performa platform secara menyeluruh',
              icon: '📋'
            }
          ]
        };
      
      default:
        return {
          title: 'Peran Tidak Diketahui',
          icon: '❓',
          description: 'Peran yang dipilih tidak memiliki penjelasan.',
          responsibilities: []
        };
    }
  };

  const roleData = getRoleExplanation(selectedRole);

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
      <div className="bg-white rounded-2xl shadow-2xl ring-2 ring-telaga-100 max-w-lg w-full flex flex-col max-h-[85vh]">
        {/* Header - Fixed */}
        <div className="flex items-center justify-between p-6 border-b border-telaga-100 flex-shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-telaga-50 rounded-full flex items-center justify-center">
              {roleData.icon}
            </div>
            <div>
              <h2 className="text-xl font-bold text-telaga-950 font-montserrat">
                {roleData.title}
              </h2>
              <p className="text-sm text-telaga-900/55 font-montserrat">
                Penjelasan Tugas & Tanggung Jawab
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 bg-telaga-50 rounded-lg flex items-center justify-center hover:bg-telaga-100 transition-colors"
          >
            <svg className="w-5 h-5 text-telaga-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content - Scrollable */}
        <div 
          className="p-6 overflow-y-auto flex-1"
          style={{ 
            WebkitOverflowScrolling: 'touch',
            overscrollBehavior: 'contain'
          }}
        >
        {/* Description */}
        <div className="mb-6">
          <p className="text-telaga-900/70 text-sm leading-relaxed font-montserrat">
            {roleData.description}
          </p>
        </div>

        {/* Responsibilities */}
        <div className="space-y-4 mb-6">
          <h3 className="text-lg font-semibold text-telaga-950 font-montserrat">
            Tugas & Tanggung Jawab:
          </h3>
          <div className="space-y-3">
            {roleData.responsibilities.map((responsibility, index) => (
              <div key={index} className="flex items-start gap-3 p-3 bg-telaga-50/70 rounded-xl">
                <div className="text-2xl">{responsibility.icon}</div>
                <div className="flex-1">
                  <h4 className="font-semibold text-telaga-950 text-sm font-montserrat mb-1">
                    {responsibility.title}
                  </h4>
                  <p className="text-telaga-900/60 text-xs font-montserrat leading-relaxed">
                    {responsibility.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
        </div>

        {/* Action Buttons - Fixed */}
        <div className="flex gap-3 p-6 border-t border-telaga-100 flex-shrink-0 bg-white rounded-b-2xl">
          <AnimatedButton
            onClick={onClose}
            className="flex-1 py-3 px-4 rounded-xl text-sm font-semibold bg-telaga-50 text-telaga-800 hover:bg-telaga-100"
            variant="grey"
          >
            Tutup
          </AnimatedButton>
          <AnimatedButton
            onClick={onConfirm}
            className="flex-1 py-3 px-4 rounded-xl text-sm font-semibold"
            variant="telaga"
          >
            Pilih Peran Ini
          </AnimatedButton>
        </div>
      </div>
    </div>
  );
};

export default RoleExplanationModal;
