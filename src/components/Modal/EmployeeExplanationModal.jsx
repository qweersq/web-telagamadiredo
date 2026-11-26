import { useState, useEffect } from 'react';
import { X, Users, Shield, Building2, Search, Filter, UserCheck, UserX, Settings, Key } from 'lucide-react';
import AnimatedButton from '../Design/AnimatedButton';

const EmployeeExplanationModal = ({ isOpen, onClose }) => {
  const [hasSeenBefore, setHasSeenBefore] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Check if user has seen this explanation before
      const hasSeen = localStorage.getItem('employee_explanation_seen');
      setHasSeenBefore(!!hasSeen);
    }
  }, [isOpen]);

  const handleClose = () => {
    // Mark as seen in localStorage
    localStorage.setItem('employee_explanation_seen', 'true');
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
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 font-montserrat">
                  Manajemen Karyawan
                </h2>
                <p className="text-sm text-gray-600">
                  Kelola akun dan peran karyawan dengan mudah
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
                  <UserCheck className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-blue-900 mb-2">
                    Fitur Utama Manajemen Karyawan
                  </h3>
                  <p className="text-sm text-blue-800">
                    Buat dan kelola akun karyawan untuk akses aplikasi. Berikan role sesuai jobdesk 
                    dan kelola status aktif/nonaktif untuk keamanan sistem.
                  </p>
                </div>
              </div>
            </div>

            {/* Features Grid */}
            <div className="grid md:grid-cols-2 gap-4">
              {/* Account Creation */}
              <div className="bg-white border-2 border-gray-100 rounded-xl p-4 hover:border-blue-200 transition-colors">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                    <Key className="w-4 h-4 text-green-600" />
                  </div>
                  <h4 className="font-semibold text-gray-900">Buat Akun Karyawan</h4>
                </div>
                <p className="text-sm text-gray-600">
                  Buat akun login untuk karyawan agar dapat mengakses aplikasi sesuai dengan peran mereka.
                </p>
              </div>

              {/* Role Management */}
              <div className="bg-white border-2 border-gray-100 rounded-xl p-4 hover:border-blue-200 transition-colors">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Shield className="w-4 h-4 text-purple-600" />
                  </div>
                  <h4 className="font-semibold text-gray-900">Sistem Role</h4>
                </div>
                <p className="text-sm text-gray-600">
                  Berikan role sesuai jobdesk: Teknisi, Admin, dengan akses yang berbeda-beda.
                </p>
              </div>

              {/* Branch Assignment */}
              <div className="bg-white border-2 border-gray-100 rounded-xl p-4 hover:border-blue-200 transition-colors">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                    <Building2 className="w-4 h-4 text-orange-600" />
                  </div>
                  <h4 className="font-semibold text-gray-900">Penugasan Cabang</h4>
                </div>
                <p className="text-sm text-gray-600">
                  Tugaskan karyawan ke cabang yang sesuai dengan lokasi kerja mereka.
                </p>
              </div>

              {/* Status Management */}
              <div className="bg-white border-2 border-gray-100 rounded-xl p-4 hover:border-blue-200 transition-colors">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                    <UserX className="w-4 h-4 text-red-600" />
                  </div>
                  <h4 className="font-semibold text-gray-900">Status Karyawan</h4>
                </div>
                <p className="text-sm text-gray-600">
                  Nonaktifkan akun karyawan yang resign agar tidak bisa login ke sistem.
                </p>
              </div>
            </div>

            {/* Role System Details */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Shield className="w-5 h-5 text-blue-600" />
                Sistem Role & Akses
              </h3>
              
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-white text-xs font-bold">1</span>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">Role Teknisi</h4>
                    <p className="text-sm text-gray-600 mb-2">
                      Karyawan dengan role teknisi dapat mengakses:
                    </p>
                    <ul className="text-xs text-gray-600 space-y-1 ml-4">
                      <li>• Peran Teknisi (cuci & perawatan)</li>
                      <li>• Peran Kurir (antar jemput)</li>
                      <li>• Peran QC (quality control)</li>
                    </ul>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-white text-xs font-bold">2</span>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">Role Admin</h4>
                    <p className="text-sm text-gray-600 mb-2">
                      Karyawan dengan role admin dapat mengakses:
                    </p>
                    <ul className="text-xs text-gray-600 space-y-1 ml-4">
                      <li>• Semua peran Teknisi</li>
                      <li>• Peran Admin (manajemen operasional)</li>
                      <li>• Akses ke data dan laporan cabang</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Management Features */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Settings className="w-5 h-5 text-blue-600" />
                Fitur Manajemen
              </h3>
              
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-white text-xs font-bold">1</span>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">Buat Akun Karyawan</h4>
                    <p className="text-sm text-gray-600">
                      Tambahkan karyawan baru dengan informasi lengkap: nama, email, nomor telepon, 
                      dan tentukan cabang tempat mereka bekerja.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-white text-xs font-bold">2</span>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">Filter & Pencarian</h4>
                    <p className="text-sm text-gray-600">
                      Gunakan filter untuk mencari karyawan berdasarkan cabang, role, atau status. 
                      Pencarian berdasarkan nama atau email untuk kemudahan akses.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-white text-xs font-bold">3</span>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">Status Management</h4>
                    <p className="text-sm text-gray-600">
                      <strong>Aktif:</strong> Karyawan dapat login dan menggunakan aplikasi<br/>
                      <strong>Nonaktif:</strong> Karyawan tidak dapat login (untuk yang resign/keluar)
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-white text-xs font-bold">4</span>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">Penugasan Cabang</h4>
                    <p className="text-sm text-gray-600">
                      Tugaskan karyawan ke cabang yang sesuai. Setiap karyawan hanya dapat 
                      mengakses data dan operasional cabang yang ditugaskan.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Workflow */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4">
              <h4 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                <Users className="w-5 h-5" />
                Alur Kerja Manajemen Karyawan
              </h4>
              <div className="space-y-2 text-sm text-blue-800">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold">1</div>
                  <span>Buat akun karyawan baru dengan informasi lengkap</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold">2</div>
                  <span>Tentukan role sesuai jobdesk (Teknisi/Admin)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold">3</div>
                  <span>Pilih cabang tempat karyawan bekerja</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold">4</div>
                  <span>Karyawan dapat login dengan akun yang dibuat</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold">5</div>
                  <span>Nonaktifkan akun jika karyawan resign/keluar</span>
                </div>
              </div>
            </div>

            {/* Tips */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-white text-xs font-bold">!</span>
                </div>
                <div>
                  <h4 className="font-semibold text-yellow-900 mb-2">Tips Penting</h4>
                  <ul className="text-sm text-yellow-800 space-y-1">
                    <li>• Pastikan email karyawan valid untuk komunikasi</li>
                    <li>• Berikan role yang sesuai dengan jobdesk karyawan</li>
                    <li>• Segera nonaktifkan akun karyawan yang resign</li>
                    <li>• Gunakan filter untuk mengelola karyawan dengan efisien</li>
                    <li>• Update informasi karyawan jika ada perubahan data</li>
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

export default EmployeeExplanationModal;
