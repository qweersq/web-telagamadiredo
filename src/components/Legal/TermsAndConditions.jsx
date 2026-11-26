import React from 'react';
import { FaTimes } from 'react-icons/fa';

const TermsAndConditions = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold font-montserrat text-gray-900">
            Syarat dan Ketentuan
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <FaTimes className="text-gray-500" />
          </button>
        </div>
        
        <div className="px-6 py-6 space-y-4">
          <div>
            <h3 className="font-semibold text-gray-900 font-montserrat mb-2">1. Penggunaan Layanan</h3>
            <p className="text-sm text-gray-700 font-montserrat">
              Dengan menggunakan NotaSepatu, Anda menyetujui untuk menggunakan layanan sesuai dengan ketentuan yang berlaku.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 font-montserrat mb-2">2. Akun Pengguna</h3>
            <p className="text-sm text-gray-700 font-montserrat">
              Anda bertanggung jawab untuk menjaga keamanan akun dan password. Segala aktivitas yang terjadi dalam akun Anda menjadi tanggung jawab Anda.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 font-montserrat mb-2">3. Pembayaran</h3>
            <p className="text-sm text-gray-700 font-montserrat">
              Pembayaran dilakukan sesuai dengan paket yang dipilih. Tidak ada pengembalian dana untuk pembayaran yang sudah dilakukan.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 font-montserrat mb-2">4. Larangan</h3>
            <p className="text-sm text-gray-700 font-montserrat">
              Dilarang menggunakan layanan untuk aktivitas ilegal, spam, atau merugikan pihak lain.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 font-montserrat mb-2">5. Perubahan Ketentuan</h3>
            <p className="text-sm text-gray-700 font-montserrat">
              NotaSepatu berhak mengubah ketentuan ini sewaktu-waktu. Perubahan akan diberitahukan melalui email atau notifikasi dalam aplikasi.
            </p>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-xs text-gray-600 font-montserrat">
              <strong>Terakhir diperbarui:</strong> {new Date().toLocaleDateString('id-ID')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsAndConditions;
