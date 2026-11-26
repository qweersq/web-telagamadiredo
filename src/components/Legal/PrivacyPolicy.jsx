import React from 'react';
import { FaTimes } from 'react-icons/fa';

const PrivacyPolicy = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold font-montserrat text-gray-900">
            Kebijakan Privasi
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
            <h3 className="font-semibold text-gray-900 font-montserrat mb-2">1. Informasi yang Kami Kumpulkan</h3>
            <p className="text-sm text-gray-700 font-montserrat">
              Kami mengumpulkan informasi bisnis, data kontak, dan informasi teknis yang diperlukan untuk menyediakan layanan NotaSepatu.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 font-montserrat mb-2">2. Penggunaan Data</h3>
            <p className="text-sm text-gray-700 font-montserrat">
              Data Anda digunakan untuk menyediakan layanan, komunikasi, dan peningkatan fitur aplikasi.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 font-montserrat mb-2">3. Perlindungan Data</h3>
            <p className="text-sm text-gray-700 font-montserrat">
              Kami menggunakan enkripsi dan keamanan standar industri untuk melindungi data pribadi Anda.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 font-montserrat mb-2">4. Berbagi Data</h3>
            <p className="text-sm text-gray-700 font-montserrat">
              Data Anda tidak akan dibagikan kepada pihak ketiga tanpa persetujuan, kecuali untuk kepentingan hukum.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 font-montserrat mb-2">5. Hak Anda</h3>
            <p className="text-sm text-gray-700 font-montserrat">
              Anda berhak mengakses, memperbarui, atau menghapus data pribadi Anda kapan saja.
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

export default PrivacyPolicy;
