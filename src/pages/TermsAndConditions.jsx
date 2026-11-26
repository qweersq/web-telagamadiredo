import { useRef, useEffect } from 'react';
import { FaFileContract, FaCheckCircle, FaTimesCircle, FaBan, FaGavel, FaInfoCircle } from 'react-icons/fa';

const TermsAndConditions = () => {
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
            <FaFileContract className="text-blue-600 text-2xl" />
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Syarat & Ketentuan (EULA)
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
            <div className="flex items-center gap-2 mb-3">
              <FaInfoCircle className="text-blue-600" />
              <h2 className="text-xl font-semibold text-gray-900">Penerimaan Ketentuan</h2>
            </div>
            <p className="text-gray-700 leading-relaxed">
              Dengan mengunduh, mengakses, atau menggunakan aplikasi NotaSepatu, Anda menyetujui untuk terikat 
              oleh Perjanjian Lisensi Pengguna Akhir (EULA) ini. Jika Anda tidak setuju dengan ketentuan ini, 
              jangan gunakan aplikasi ini.
            </p>
          </section>

          {/* License */}
          <section>
            <div className="flex items-center gap-2 mb-3">
              <FaFileContract className="text-blue-600" />
              <h2 className="text-xl font-semibold text-gray-900">Lisensi Penggunaan</h2>
            </div>
            <p className="text-gray-700 leading-relaxed">
              NotaSepatu memberikan Anda lisensi terbatas, non-eksklusif, dan tidak dapat dialihkan untuk 
              menggunakan aplikasi sesuai dengan ketentuan EULA ini. Lisensi ini diberikan untuk penggunaan 
              bisnis internal Anda.
            </p>
          </section>

          {/* Subscription & Billing */}
          <section>
            <div className="flex items-center gap-2 mb-3">
              <FaCheckCircle className="text-blue-600" />
              <h2 className="text-xl font-semibold text-gray-900">Langganan dan Pembayaran</h2>
            </div>
            <ul className="list-disc list-inside space-y-2 text-gray-700 ml-6">
              <li>Layanan NotaSepatu tersedia dalam model berlangganan bulanan</li>
              <li>Pembayaran dilakukan di muka untuk setiap periode langganan</li>
              <li>Pembelian dalam aplikasi (IAP) untuk pengguna iOS diproses oleh Apple App Store</li>
              <li>Pembelian AI Credit bersifat sekali pakai (consumable) dan tidak dapat dikembalikan</li>
              <li>Harga dapat berubah sewaktu-waktu dengan pemberitahuan terlebih dahulu</li>
            </ul>
          </section>

          {/* User Responsibilities */}
          <section>
            <div className="flex items-center gap-2 mb-3">
              <FaBan className="text-blue-600" />
              <h2 className="text-xl font-semibold text-gray-900">Tanggung Jawab Pengguna</h2>
            </div>
            <p className="text-gray-700 leading-relaxed mb-2">Anda setuju untuk:</p>
            <ul className="list-disc list-inside space-y-2 text-gray-700 ml-6">
              <li>Memberikan informasi akun yang akurat dan terkini</li>
              <li>Menjaga kerahasiaan kredensial akun Anda</li>
              <li>Tidak menyalahgunakan aplikasi untuk aktivitas ilegal</li>
              <li>Tidak mencoba meretas, memodifikasi, atau merekayasa balik aplikasi</li>
              <li>Tidak menggunakan aplikasi untuk melanggar hukum yang berlaku</li>
            </ul>
          </section>

          {/* AI Credit */}
          <section>
            <div className="flex items-center gap-2 mb-3">
              <FaInfoCircle className="text-blue-600" />
              <h2 className="text-xl font-semibold text-gray-900">AI Credit</h2>
            </div>
            <ul className="list-disc list-inside space-y-2 text-gray-700 ml-6">
              <li>AI Credit adalah unit virtual yang digunakan untuk fitur deteksi AI</li>
              <li>Setiap deteksi AI menghabiskan 1 (satu) credit</li>
              <li>Credit yang dibeli tidak memiliki masa berlaku dan tidak dapat ditukar dengan uang tunai</li>
              <li>Credit yang sudah digunakan tidak dapat dikembalikan</li>
            </ul>
          </section>

          {/* Refund & Cancellation */}
          <section>
            <div className="flex items-center gap-2 mb-3">
              <FaTimesCircle className="text-blue-600" />
              <h2 className="text-xl font-semibold text-gray-900">Pengembalian Dana dan Pembatalan</h2>
            </div>
            <ul className="list-disc list-inside space-y-2 text-gray-700 ml-6">
              <li>Pembayaran langganan yang sudah diproses tidak dapat dikembalikan kecuali diwajibkan oleh hukum</li>
              <li>Pembatalan langganan akan berlaku pada periode berikutnya</li>
              <li>AI Credit yang sudah dibeli tidak dapat dikembalikan</li>
              <li>Untuk pengembalian dana IAP iOS, silakan hubungi Apple Support</li>
            </ul>
          </section>

          {/* Intellectual Property */}
          <section>
            <div className="flex items-center gap-2 mb-3">
              <FaGavel className="text-blue-600" />
              <h2 className="text-xl font-semibold text-gray-900">Hak Kekayaan Intelektual</h2>
            </div>
            <p className="text-gray-700 leading-relaxed">
              Seluruh hak cipta, merek dagang, dan hak kekayaan intelektual lainnya dalam aplikasi NotaSepatu 
              adalah milik NotaSepatu. Anda tidak diperbolehkan menyalin, memodifikasi, mendistribusikan, atau 
              membuat karya turunan dari aplikasi tanpa izin tertulis.
            </p>
          </section>

          {/* Limitation of Liability */}
          <section>
            <div className="flex items-center gap-2 mb-3">
              <FaBan className="text-blue-600" />
              <h2 className="text-xl font-semibold text-gray-900">Batas Tanggung Jawab</h2>
            </div>
            <p className="text-gray-700 leading-relaxed">
              NotaSepatu tidak bertanggung jawab atas kerugian tidak langsung, insidental, atau konsekuensial 
              yang timbul dari penggunaan atau ketidakmampuan menggunakan aplikasi, termasuk namun tidak terbatas 
              pada kehilangan data, kehilangan pendapatan, atau gangguan bisnis.
            </p>
          </section>

          {/* Termination */}
          <section>
            <div className="flex items-center gap-2 mb-3">
              <FaTimesCircle className="text-blue-600" />
              <h2 className="text-xl font-semibold text-gray-900">Penghentian Layanan</h2>
            </div>
            <p className="text-gray-700 leading-relaxed">
              Kami berhak untuk menghentikan atau menangguhkan akses Anda ke aplikasi setiap saat, tanpa 
              pemberitahuan sebelumnya, jika Anda melanggar ketentuan EULA ini atau terlibat dalam aktivitas 
              yang merugikan pengguna lain atau NotaSepatu.
            </p>
          </section>

          {/* Changes */}
          <section>
            <div className="flex items-center gap-2 mb-3">
              <FaFileContract className="text-blue-600" />
              <h2 className="text-xl font-semibold text-gray-900">Perubahan Ketentuan</h2>
            </div>
            <p className="text-gray-700 leading-relaxed">
              Kami dapat memperbarui EULA ini dari waktu ke waktu. Perubahan akan diberitahukan melalui aplikasi 
              atau email. Penggunaan lanjutan aplikasi setelah perubahan merupakan penerimaan Anda terhadap 
              ketentuan yang diperbarui.
            </p>
          </section>

          {/* Contact */}
          <section className="bg-blue-50 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-3">Kontak Kami</h2>
            <p className="text-gray-700 leading-relaxed">
              Jika Anda memiliki pertanyaan tentang EULA ini, silakan hubungi kami melalui email atau melalui aplikasi.
            </p>
          </section>

          {/* Footer Note */}
          <section className="border-t border-gray-200 pt-6">
            <p className="text-sm text-gray-500 text-center">
              Dengan menggunakan aplikasi NotaSepatu, Anda menyetujui Syarat & Ketentuan ini.
            </p>
          </section>

        </div>
      </div>
    </div>
  );
};

export default TermsAndConditions;
