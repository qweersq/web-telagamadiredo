import { useRef, useEffect, useState } from 'react';
import { FaTrashAlt, FaEnvelope, FaUser, FaInfoCircle } from 'react-icons/fa';

const DeleteAccount = () => {
  const topRef = useRef(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    reason: ''
  });

  useEffect(() => {
    if (topRef.current) {
      topRef.current.scrollIntoView({ behavior: 'instant' });
    }
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const subject = encodeURIComponent('Permintaan Penghapusan Akun - NotaSepatu');
    const body = encodeURIComponent(
      `Halo Tim NotaSepatu,\n\n` +
      `Saya ingin meminta penghapusan akun dan semua data yang terkait dengan akun saya.\n\n` +
      `Detail Akun:\n` +
      `Nama: ${formData.name}\n` +
      `Email: ${formData.email}\n\n` +
      `Alasan Penghapusan:\n${formData.reason}\n\n` +
      `Saya memahami bahwa setelah penghapusan akun, semua data saya akan dihapus secara permanen dan tidak dapat dikembalikan.\n\n` +
      `Terima kasih.\n\n` +
      `---\n` +
      `Email ini dikirim melalui form Delete Account di aplikasi NotaSepatu`
    );
    
    const mailtoLink = `mailto:notasepatu@gmail.com?subject=${subject}&body=${body}`;
    window.location.href = mailtoLink;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div ref={topRef}></div>
      
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-3">
            <FaTrashAlt className="text-red-600 text-2xl" />
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Hapus Akun
            </h1>
          </div>
          <p className="text-sm text-gray-500 mt-2">
            Permintaan penghapusan akun dan data terkait
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm p-6 sm:p-8 space-y-6">
          
          {/* Warning */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <FaInfoCircle className="text-red-600 text-xl mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-red-900 mb-2">Peringatan Penting</h3>
                <ul className="text-sm text-red-800 space-y-1 list-disc list-inside">
                  <li>Penghapusan akun bersifat permanen dan tidak dapat dibatalkan</li>
                  <li>Semua data Anda akan dihapus, termasuk pesanan, pelanggan, dan laporan</li>
                  <li>Proses penghapusan akan diproses dalam 7-14 hari kerja</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Nama Lengkap <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="name"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Masukkan nama lengkap Anda"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Akun <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                id="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="email@example.com"
              />
            </div>

            <div>
              <label htmlFor="reason" className="block text-sm font-medium text-gray-700 mb-2">
                Alasan Penghapusan <span className="text-red-500">*</span>
              </label>
              <textarea
                id="reason"
                required
                rows={4}
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Jelaskan alasan Anda ingin menghapus akun..."
              />
            </div>

            <div className="pt-4">
              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors"
              >
                <FaEnvelope className="text-lg" />
                Kirim Permintaan via Email
              </button>
              <p className="text-xs text-gray-500 text-center mt-2">
                Tombol ini akan membuka aplikasi email Anda dengan template yang sudah disiapkan
              </p>
            </div>
          </form>

          {/* Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              <strong>Catatan:</strong> Setelah mengirim email, tim kami akan memverifikasi permintaan Anda 
              dan memproses penghapusan akun dalam 7-14 hari kerja. Anda akan menerima konfirmasi via email 
              setelah proses selesai.
            </p>
          </div>

        </div>
      </div>
    </div>
  );
};

export default DeleteAccount;













