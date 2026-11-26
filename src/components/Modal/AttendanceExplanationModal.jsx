import { useState, useEffect } from 'react';
import { X, Clock, Users, Building2, Calendar, Filter, Eye, Edit, Trash2, CheckCircle, AlertTriangle } from 'lucide-react';
import AnimatedButton from '../Design/AnimatedButton';

const AttendanceExplanationModal = ({ isOpen, onClose }) => {
  const [hasSeenBefore, setHasSeenBefore] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Check if user has seen this explanation before
      const hasSeen = localStorage.getItem('attendance_explanation_seen');
      setHasSeenBefore(!!hasSeen);
    }
  }, [isOpen]);

  const handleClose = () => {
    // Mark as seen in localStorage
    localStorage.setItem('attendance_explanation_seen', 'true');
    onClose();
  };

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
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[85vh]">
        {/* Header - Fixed */}
        <div className="bg-white border-b border-gray-200 px-6 py-4 rounded-t-2xl flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                <Clock className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 font-montserrat">
                  Manajemen Absensi Karyawan
                </h2>
                <p className="text-sm text-gray-600">
                  Pantau dan kelola kehadiran karyawan di semua outlet
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
          <div className="space-y-6">
            {/* Overview */}
            <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <CheckCircle className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-blue-900 mb-2">
                    Fitur Utama Manajemen Absensi
                  </h3>
                  <p className="text-sm text-blue-800">
                    Pantau dan kelola kehadiran karyawan di semua outlet yang Anda miliki. 
                    Lihat data absensi setiap karyawan dengan filter berdasarkan bulan dan tahun.
                  </p>
                </div>
              </div>
            </div>

            {/* Features Grid */}
            <div className="grid md:grid-cols-2 gap-4">
              {/* Multi-Outlet Monitoring */}
              <div className="bg-white border-2 border-gray-100 rounded-xl p-4 hover:border-blue-200 transition-colors">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                    <Building2 className="w-4 h-4 text-green-600" />
                  </div>
                  <h4 className="font-semibold text-gray-900">Multi-Outlet Monitoring</h4>
                </div>
                <p className="text-sm text-gray-600">
                  Pantau absensi karyawan di semua outlet yang Anda miliki dari satu dashboard.
                </p>
              </div>

              {/* Employee Tracking */}
              <div className="bg-white border-2 border-gray-100 rounded-xl p-4 hover:border-blue-200 transition-colors">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Users className="w-4 h-4 text-purple-600" />
                  </div>
                  <h4 className="font-semibold text-gray-900">Tracking Per Karyawan</h4>
                </div>
                <p className="text-sm text-gray-600">
                  Lihat data absensi detail setiap karyawan dengan jam masuk, keluar, dan total jam kerja.
                </p>
              </div>

              {/* Monthly Filtering */}
              <div className="bg-white border-2 border-gray-100 rounded-xl p-4 hover:border-blue-200 transition-colors">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                    <Calendar className="w-4 h-4 text-orange-600" />
                  </div>
                  <h4 className="font-semibold text-gray-900">Filter Bulanan</h4>
                </div>
                <p className="text-sm text-gray-600">
                  Filter data absensi berdasarkan bulan dan tahun untuk analisis yang lebih detail.
                </p>
              </div>

              {/* Data Management */}
              <div className="bg-white border-2 border-gray-100 rounded-xl p-4 hover:border-blue-200 transition-colors">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                    <Edit className="w-4 h-4 text-red-600" />
                  </div>
                  <h4 className="font-semibold text-gray-900">Kelola Data Absensi</h4>
                </div>
                <p className="text-sm text-gray-600">
                  Edit atau hapus data absensi untuk koreksi dan maintenance data.
                </p>
              </div>
            </div>

            {/* How to Use */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Eye className="w-5 h-5 text-blue-600" />
                Cara Menggunakan
              </h3>
              
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-white text-xs font-bold">1</span>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">Pilih Outlet</h4>
                    <p className="text-sm text-gray-600">
                      Klik tombol "Ubah Filter" dan pilih outlet yang ingin Anda pantau. 
                      Anda dapat melihat semua outlet yang tersedia.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-white text-xs font-bold">2</span>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">Pilih Karyawan</h4>
                    <p className="text-sm text-gray-600">
                      Setelah memilih outlet, pilih karyawan yang ingin Anda lihat data absensinya. 
                      Hanya karyawan aktif yang akan ditampilkan.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-white text-xs font-bold">3</span>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">Atur Periode</h4>
                    <p className="text-sm text-gray-600">
                      Pilih bulan dan tahun untuk melihat data absensi pada periode tertentu. 
                      Data akan difilter sesuai dengan periode yang dipilih.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-white text-xs font-bold">4</span>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">Lihat Data Absensi</h4>
                    <p className="text-sm text-gray-600">
                      Data absensi akan ditampilkan dengan detail jam masuk, keluar, status kehadiran, 
                      dan total jam kerja untuk setiap hari.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Data Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Filter className="w-5 h-5 text-blue-600" />
                Informasi Data Absensi
              </h3>
              
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-white text-xs font-bold">1</span>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">Status Kehadiran</h4>
                    <p className="text-sm text-gray-600 mb-2">
                      Setiap data absensi memiliki status:
                    </p>
                    <ul className="text-xs text-gray-600 space-y-1 ml-4">
                      <li>• <span className="font-semibold text-green-600">Hadir</span> - Karyawan hadir tepat waktu</li>
                      <li>• <span className="font-semibold text-red-600">Izin</span> - Karyawan tidak hadir</li>
                    </ul>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-white text-xs font-bold">2</span>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">Detail Waktu</h4>
                    <p className="text-sm text-gray-600 mb-2">
                      Setiap data menampilkan:
                    </p>
                    <ul className="text-xs text-gray-600 space-y-1 ml-4">
                      <li>• <span className="font-semibold">Jam Masuk</span> - Waktu karyawan mulai bekerja</li>
                      <li>• <span className="font-semibold">Jam Keluar</span> - Waktu karyawan selesai bekerja</li>
                      <li>• <span className="font-semibold">Total Jam Kerja</span> - Durasi kerja dalam jam dan menit</li>
                      <li>• <span className="font-semibold">Catatan</span> - Informasi tambahan jika ada</li>
                    </ul>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-white text-xs font-bold">3</span>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">Manajemen Data</h4>
                    <p className="text-sm text-gray-600 mb-2">
                      Sebagai superadmin, Anda dapat:
                    </p>
                    <ul className="text-xs text-gray-600 space-y-1 ml-4">
                      <li>• <span className="font-semibold">Edit Data</span> - Ubah jam masuk/keluar dan catatan</li>
                      <li>• <span className="font-semibold">Hapus Data</span> - Hapus data absensi yang tidak valid</li>
                      <li>• <span className="font-semibold">Lihat Detail</span> - Lihat informasi lengkap setiap absensi</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Workflow */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4">
              <h4 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Alur Kerja Manajemen Absensi
              </h4>
              <div className="space-y-2 text-sm text-blue-800">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold">1</div>
                  <span>Pilih outlet yang ingin dipantau</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold">2</div>
                  <span>Pilih karyawan yang ingin dilihat data absensinya</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold">3</div>
                  <span>Atur periode (bulan dan tahun) untuk filter data</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold">4</div>
                  <span>Lihat data absensi dengan detail jam kerja</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold">5</div>
                  <span>Edit atau hapus data jika diperlukan (superadmin)</span>
                </div>
              </div>
            </div>

            {/* Tips */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <AlertTriangle className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h4 className="font-semibold text-yellow-900 mb-2">Tips Penting</h4>
                  <ul className="text-sm text-yellow-800 space-y-1">
                    <li>• Pastikan outlet dan karyawan sudah dipilih sebelum melihat data</li>
                    <li>• Gunakan filter bulan/tahun untuk analisis yang lebih fokus</li>
                    <li>• Data absensi hanya menampilkan karyawan aktif di outlet tersebut</li>
                    <li>• Sebagai superadmin, Anda dapat mengelola data absensi</li>
                    <li>• Total jam kerja dihitung otomatis dari jam masuk dan keluar</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 p-6 border-t border-gray-200">
          <div className="flex gap-3">
            <AnimatedButton
              onClick={onClose}
              className="flex-1 py-3 bg-gray-500 text-white rounded-xl font-semibold text-sm hover:bg-gray-600 transition-all duration-200 font-montserrat"
            >
              Tutup
            </AnimatedButton>
            <AnimatedButton
              onClick={handleClose}
              className="flex-1 py-3 bg-blue-500 text-white rounded-xl font-semibold text-sm hover:bg-blue-600 transition-all duration-200 font-montserrat"
            >
              Mengerti
            </AnimatedButton>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AttendanceExplanationModal;
