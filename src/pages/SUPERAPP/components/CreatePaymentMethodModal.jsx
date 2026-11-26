import { useState } from "react";
import AnimatedButton from "../../../components/Design/AnimatedButton";
import instance from "../../../config/api";

const CreatePaymentMethodModal = ({ isOpen, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    type: 'cash',
    icon: '',
    is_active: true
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await instance.post('/payment-methods', formData);
      if (response.data.success) {
        alert('Payment method berhasil dibuat');
        onSuccess();
      } else {
        throw new Error(response.data.error?.message || 'Failed to create payment method');
      }
    } catch (error) {
      console.error('❌ Error creating payment method:', error);
      alert('Gagal membuat payment method. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    let newValue = type === 'checkbox' ? checked : value;
    
    // Validasi khusus untuk field code
    if (name === 'code') {
      // Hapus spasi dan ubah ke huruf kecil
      newValue = newValue.replace(/\s+/g, '').toLowerCase();
    }
    
    setFormData(prev => {
      const updated = {
        ...prev,
        [name]: newValue
      };
      
      // Auto-sync type dan icon dengan code
      if (name === 'code') {
        updated.type = newValue;
        updated.icon = newValue;
      }
      
      return updated;
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900 font-montserrat">Tambah Payment Method</h2>
            <button
              onClick={onClose}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-all duration-200"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 font-montserrat mb-1">
                Nama Payment Method *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-montserrat"
                placeholder="Contoh: Cash, Bank Transfer, QRIS"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 font-montserrat mb-1">
                Kode * (huruf kecil, tanpa spasi)
              </label>
              <input
                type="text"
                name="code"
                value={formData.code}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-montserrat"
                placeholder="Contoh: cash, bank_transfer, qris"
              />
            </div>


            <div className="flex items-center">
              <input
                type="checkbox"
                name="is_active"
                checked={formData.is_active}
                onChange={handleChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label className="ml-2 block text-sm text-gray-700 font-montserrat">
                Aktif
              </label>
            </div>

            <div className="flex gap-3 pt-4">
              <AnimatedButton
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 font-montserrat"
              >
                Batal
              </AnimatedButton>
              <AnimatedButton
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-montserrat"
              >
                {loading ? '⏳ Membuat...' : '✅ Buat'}
              </AnimatedButton>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreatePaymentMethodModal;
