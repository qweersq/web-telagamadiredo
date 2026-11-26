import { useState, useEffect } from 'react';
import { X, MapPin, Building2, Users, Phone, Navigation, Shield, Clock, CheckCircle, Store } from 'lucide-react';
import AnimatedButton from '../Design/AnimatedButton';

const BranchExplanationModal = ({ isOpen, onClose }) => {
  const [hasSeenBefore, setHasSeenBefore] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Check if user has seen this explanation before
      const hasSeen = localStorage.getItem('branch_explanation_seen');
      setHasSeenBefore(!!hasSeen);
    }
  }, [isOpen]);

  const handleClose = () => {
    // Mark as seen in localStorage
    localStorage.setItem('branch_explanation_seen', 'true');
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
                <Building2 className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 font-montserrat">
                  Manajemen Outlet
                </h2>
                <p className="text-sm text-gray-600">
                  Kelola cabang bisnis Anda dengan mudah
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
                    Fitur Utama Manajemen Outlet
                  </h3>
                  <p className="text-sm text-blue-800">
                    Buat dan kelola cabang bisnis sesuai dengan paket subscription Anda.
                    Setiap outlet dapat dikonfigurasi dengan informasi lengkap untuk operasional yang optimal.
                  </p>
                </div>
              </div>
            </div>

            {/* Branch Types Explanation */}
            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-4 border border-indigo-100">
              <h3 className="font-semibold text-indigo-900 mb-3 flex items-center gap-2">
                <Store className="w-5 h-5" />
                Jenis Cabang
              </h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-white/60 p-3 rounded-lg border border-indigo-100">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="bg-blue-100 p-1.5 rounded-lg">
                      <Building2 className="w-4 h-4 text-blue-600" />
                    </span>
                    <span className="font-semibold text-gray-800 text-sm">Cabang Utama (Central)</span>
                  </div>
                  <ul className="text-xs text-gray-600 space-y-1 ml-1">
                    <li>• Pusat operasional penuh (Cuci & Service)</li>
                    <li>• Mengelola stok & keuangan mandiri</li>
                    <li>• Menjadi induk bagi Mitra/Droppoint</li>
                  </ul>
                </div>

                <div className="bg-white/60 p-3 rounded-lg border border-purple-100">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="bg-purple-100 p-1.5 rounded-lg">
                      <MapPin className="w-4 h-4 text-purple-600" />
                    </span>
                    <span className="font-semibold text-gray-800 text-sm">Mitra (Droppoint)</span>
                  </div>
                  <ul className="text-xs text-gray-600 space-y-1 ml-1">
                    <li>• Titik antar-jemput order (Pick-up Point)</li>
                    <li>• Wajib berelasi dengan Cabang Pusat</li>
                    <li>• Order dari mitra/droppoint ditampilkan di Cabang Pusat</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Features Grid */}
            <div className="grid md:grid-cols-2 gap-4">
              {/* Subscription-based Creation */}
              <div className="bg-white border-2 border-gray-100 rounded-xl p-4 hover:border-blue-200 transition-colors">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                    <Shield className="w-4 h-4 text-green-600" />
                  </div>
                  <h4 className="font-semibold text-gray-900">Paket Subscription</h4>
                </div>
                <p className="text-sm text-gray-600">
                  Jumlah outlet yang dapat dibuat disesuaikan dengan paket subscription yang Anda pilih.
                  Upgrade paket untuk menambah lebih banyak outlet.
                </p>
              </div>

              {/* Branch Information */}
              <div className="bg-white border-2 border-gray-100 rounded-xl p-4 hover:border-blue-200 transition-colors">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Building2 className="w-4 h-4 text-blue-600" />
                  </div>
                  <h4 className="font-semibold text-gray-900">Informasi Outlet</h4>
                </div>
                <p className="text-sm text-gray-600">
                  Konfigurasi nama outlet, alamat lengkap, dan nomor telepon manager untuk identifikasi yang jelas.
                </p>
              </div>

              {/* Location Services */}
              <div className="bg-white border-2 border-gray-100 rounded-xl p-4 hover:border-blue-200 transition-colors">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Navigation className="w-4 h-4 text-purple-600" />
                  </div>
                  <h4 className="font-semibold text-gray-900">Lokasi & Koordinat</h4>
                </div>
                <p className="text-sm text-gray-600">
                  Masukkan kota dan koordinat latitude/longitude untuk validasi lokasi absensi karyawan.
                </p>
              </div>

              {/* Attendance Validation */}
              <div className="bg-white border-2 border-gray-100 rounded-xl p-4 hover:border-blue-200 transition-colors">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                    <Clock className="w-4 h-4 text-orange-600" />
                  </div>
                  <h4 className="font-semibold text-gray-900">Validasi Absensi</h4>
                </div>
                <p className="text-sm text-gray-600">
                  Karyawan hanya bisa absen ketika berada di dalam radius toko berdasarkan koordinat yang ditentukan.
                </p>
              </div>
            </div>

            {/* Detailed Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-blue-600" />
                Informasi Detail Outlet
              </h3>

              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-white text-xs font-bold">1</span>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">Nama Outlet</h4>
                    <p className="text-sm text-gray-600">
                      Berikan nama yang unik dan mudah diingat untuk setiap outlet.
                      Contoh: "NotaSepatu Cabang Mall Tunjungan" atau "NotaSepatu Outlet Rungkut"
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-white text-xs font-bold">2</span>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">Alamat Lengkap</h4>
                    <p className="text-sm text-gray-600">
                      Masukkan alamat detail termasuk nomor rumah, jalan, RT/RW, dan kelurahan.
                      Alamat ini akan digunakan untuk identifikasi dan navigasi.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-white text-xs font-bold">3</span>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">Nomor Telepon Manager</h4>
                    <p className="text-sm text-gray-600">
                      Nomor HP manager outlet untuk komunikasi dan koordinasi operasional.
                      Format nomor akan divalidasi secara otomatis.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-white text-xs font-bold">4</span>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">Kota & Status</h4>
                    <p className="text-sm text-gray-600">
                      Pilih kota tempat outlet berada dan tentukan status operasional
                      (Aktif, Maintenance, Ditangguhkan, dll).
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-white text-xs font-bold">5</span>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">Koordinat GPS (Latitude & Longitude)</h4>
                    <p className="text-sm text-gray-600 mb-3">
                      <strong>PENTING:</strong> Koordinat ini digunakan untuk validasi absensi karyawan.
                      Karyawan hanya bisa absen ketika berada di dalam radius toko.
                      Pastikan koordinat akurat untuk keamanan sistem absensi.
                    </p>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <h5 className="font-semibold text-blue-900 mb-2 text-sm">Cara Mengambil Koordinat dari Google Maps:</h5>
                      <ol className="text-xs text-blue-800 space-y-1 list-decimal list-inside">
                        <li>Buka <strong>Google Maps</strong> di browser atau aplikasi</li>
                        <li>Cari lokasi outlet Anda dengan alamat lengkap</li>
                        <li><strong>Klik kanan</strong> pada titik lokasi yang tepat</li>
                        <li>Pilih <strong>"Koordinat"</strong> atau <strong>"Copy coordinates"</strong></li>
                        <li>Salin angka pertama sebagai <strong>Latitude</strong> (contoh: -7.250000)</li>
                        <li>Salin angka kedua sebagai <strong>Longitude</strong> (contoh: 112.750000)</li>
                      </ol>
                      <div className="mt-2 text-xs text-blue-700 bg-blue-100 rounded px-2 py-1">
                        💡 <strong>Tips:</strong> Pastikan koordinat menunjukkan lokasi yang tepat di dalam bangunan outlet
                      </div>
                    </div>
                  </div>
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
                    <li>• Pastikan koordinat GPS akurat untuk sistem absensi</li>
                    <li>• Gunakan Google Maps untuk mendapatkan koordinat yang tepat</li>
                    <li>• Update status outlet sesuai kondisi operasional</li>
                    <li>• Nomor telepon manager harus aktif dan dapat dihubungi</li>
                    <li>• Alamat lengkap membantu pelanggan menemukan outlet</li>
                    <li>• Test koordinat dengan membuka Google Maps dan cek lokasi</li>
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

export default BranchExplanationModal;
