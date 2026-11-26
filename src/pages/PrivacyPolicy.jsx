import { useRef, useEffect } from 'react';
import { FaShieldAlt, FaLock, FaUserShield, FaDatabase, FaEye } from 'react-icons/fa';

const PrivacyPolicy = () => {
  const topRef = useRef(null);

  useEffect(() => {
    if (topRef.current) {
      topRef.current.scrollIntoView({ behavior: 'instant' });
    }
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <div ref={topRef}></div>
      
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-3">
            <FaShieldAlt className="text-blue-600 text-2xl" />
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Kebijakan Privasi
            </h1>
          </div>
          <p className="text-sm text-gray-500 mt-2">
            Terakhir diperbarui: {new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm p-6 sm:p-8 space-y-6">
          
          {/* Introduction */}
          <section>
            <p className="text-gray-700 leading-relaxed">
              Kami menghormati privasi Anda dan berkomitmen untuk melindungi data pribadi yang Anda berikan kepada kami. 
              Kebijakan privasi ini menjelaskan bagaimana kami mengumpulkan, menggunakan, dan melindungi informasi Anda 
              saat menggunakan aplikasi NotaSepatu.
            </p>
          </section>

          {/* Data Collection */}
          <section>
            <div className="flex items-center gap-2 mb-3">
              <FaDatabase className="text-blue-600" />
              <h2 className="text-xl font-semibold text-gray-900">Data yang Kami Kumpulkan</h2>
            </div>
            <ul className="list-disc list-inside space-y-2 text-gray-700 ml-6">
              <li>Informasi akun (nama, email, nomor telepon)</li>
              <li>Data bisnis (nama bisnis, alamat, informasi cabang)</li>
              <li>Data transaksi dan pesanan</li>
              <li>Data pelanggan yang Anda input ke dalam sistem</li>
              <li>Data kehadiran dan absensi karyawan</li>
              <li>Foto item dan dokumen yang diunggah</li>
            </ul>
          </section>

          {/* Data Usage */}
          <section>
            <div className="flex items-center gap-2 mb-3">
              <FaEye className="text-blue-600" />
              <h2 className="text-xl font-semibold text-gray-900">Penggunaan Data</h2>
            </div>
            <p className="text-gray-700 leading-relaxed mb-2">
              Data yang kami kumpulkan digunakan untuk:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-700 ml-6">
              <li>Menyediakan dan meningkatkan layanan aplikasi</li>
              <li>Memproses transaksi dan pesanan</li>
              <li>Mengelola akun dan keamanan pengguna</li>
              <li>Memberikan dukungan pelanggan</li>
              <li>Mengirim notifikasi penting terkait layanan</li>
            </ul>
          </section>

          {/* Data Protection */}
          <section>
            <div className="flex items-center gap-2 mb-3">
              <FaLock className="text-blue-600" />
              <h2 className="text-xl font-semibold text-gray-900">Perlindungan Data</h2>
            </div>
            <p className="text-gray-700 leading-relaxed">
              Kami menggunakan langkah-langkah keamanan teknis dan organisasi yang sesuai untuk melindungi data pribadi Anda 
              dari akses, penggunaan, atau pengungkapan yang tidak sah. Data disimpan di server yang aman dan dienkripsi 
              menggunakan teknologi standar industri.
            </p>
          </section>

          {/* Data Sharing */}
          <section>
            <div className="flex items-center gap-2 mb-3">
              <FaUserShield className="text-blue-600" />
              <h2 className="text-xl font-semibold text-gray-900">Berbagi Data</h2>
            </div>
            <p className="text-gray-700 leading-relaxed">
              Kami tidak menjual, menyewakan, atau membagikan data pribadi Anda kepada pihak ketiga, kecuali:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-700 ml-6 mt-2">
              <li>Dengan persetujuan Anda</li>
              <li>Untuk mematuhi kewajiban hukum</li>
              <li>Dengan penyedia layanan yang membantu kami mengoperasikan aplikasi (dengan perjanjian kerahasiaan)</li>
            </ul>
          </section>

          {/* User Rights */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">Hak Pengguna</h2>
            <p className="text-gray-700 leading-relaxed mb-2">
              Anda memiliki hak untuk:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-700 ml-6">
              <li>Mengakses dan memperbarui data pribadi Anda</li>
              <li>Meminta penghapusan data pribadi Anda</li>
              <li>Menolak pemrosesan data tertentu</li>
              <li>Mengunduh data Anda dalam format yang dapat dibaca</li>
            </ul>
          </section>

          {/* Contact */}
          <section className="bg-blue-50 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-3">Kontak Kami</h2>
            <p className="text-gray-700 leading-relaxed">
              Jika Anda memiliki pertanyaan atau kekhawatiran tentang kebijakan privasi ini, 
              silakan hubungi kami melalui email atau melalui aplikasi.
            </p>
          </section>

          {/* Footer Note */}
          <section className="border-t border-gray-200 pt-6">
            <p className="text-sm text-gray-500 text-center">
              Dengan menggunakan aplikasi NotaSepatu, Anda menyetujui kebijakan privasi ini.
            </p>
          </section>

        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;

