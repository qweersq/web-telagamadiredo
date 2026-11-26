import React, { useState, useEffect } from 'react';
import { X, Save, User, MessageSquare } from 'lucide-react';
import { updateCustomer } from '../../api/orderApi';
import AnimatedButton from '../../../../components/Design/AnimatedButton';

const NOTE_MAX_LENGTH = 500;

const EditCustomerModal = ({ isOpen, onClose, customer, onSuccess }) => {
  const [formData, setFormData] = useState({ name: '', note: '' });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (customer) {
      setFormData({
        name: customer.name || '',
        note: customer.description || '',
      });
      setErrors({});
    }
  }, [customer]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Nama customer wajib diisi';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      // Nomor HP / alamat / link maps tidak dikelola dari kasir Telaga.
      // Nilai lama dikirim balik apa adanya supaya tidak ikut terhapus.
      const updatedCustomer = await updateCustomer(customer.id, {
        name: formData.name.trim(),
        description: formData.note.trim() || null,
        phone: customer.phone || null,
        address: customer.address || null,
        gmaps: customer.gmaps || null,
      });
      onSuccess(updatedCustomer);
      onClose();
    } catch (error) {
      console.error('Error updating customer:', error);
      const msg = error?.response?.data?.message || error?.response?.data?.error?.message;
      setErrors({ general: msg || 'Gagal mengupdate customer. Silakan coba lagi.' });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => { if (!loading) onClose(); };

  if (!isOpen || !customer) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-3xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto outline outline-2 outline-[#EEF1F7]">
        {/* Header */}
        <div className="text-center p-6 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold sm:text-3xl font-montserrat font-normal text-gray-800 tracking-wide">
              Edit Customer
            </h2>
            <button onClick={handleClose} disabled={loading} className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50">
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
          <p className="text-xs text-gray-600 px-1 font-montserrat">Silakan edit data customer sesuai kebutuhan!</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errors.general && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600 font-montserrat">{errors.general}</p>
            </div>
          )}

          {/* Name */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2 font-montserrat">
              <User className="w-4 h-4" /> Nama Customer
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className={`block w-full px-3 py-3 sm:py-3.5 border rounded-xl bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-telaga-400 focus:border-transparent text-sm font-montserrat transition-all ${errors.name ? 'border-red-300' : 'border-gray-200'}`}
              placeholder="Masukkan nama customer"
              disabled={loading}
            />
            {errors.name && <p className="mt-1 text-sm text-red-600 font-montserrat">{errors.name}</p>}
          </div>

          {/* Catatan pelanggan (customers.description) */}
          <div>
            <label
              htmlFor="customer-note"
              className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-700 font-montserrat"
            >
              <MessageSquare className="w-4 h-4" /> Catatan Pelanggan
              <span className="font-normal text-gray-400">(Opsional)</span>
            </label>
            <textarea
              id="customer-note"
              value={formData.note}
              onChange={(e) => handleInputChange('note', e.target.value)}
              rows={4}
              maxLength={NOTE_MAX_LENGTH}
              className="block w-full resize-none rounded-xl border border-gray-200 bg-white px-3 py-3 text-sm font-montserrat placeholder-gray-400 transition-all focus:border-transparent focus:outline-none focus:ring-2 focus:ring-telaga-400 sm:py-3.5"
              placeholder="Mis. langganan tanpa gula, alergi kacang, pelanggan setia"
              disabled={loading}
            />
            <p className="mt-1 flex items-center justify-between text-xs font-montserrat">
              <span className="text-gray-400">Tersimpan sebagai catatan profil pelanggan</span>
              <span className="text-gray-400">{formData.note.length}/{NOTE_MAX_LENGTH}</span>
            </p>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <AnimatedButton type="button" variant="grey" onClick={handleClose} disabled={loading} className="flex-1 h-[40px] py-3 sm:py-3.5 px-4">
              Batal
            </AnimatedButton>
            <AnimatedButton type="submit" variant="telaga" disabled={loading} className="flex-1 h-[40px] py-3 sm:py-3.5 px-4 flex items-center justify-center gap-2">
              {loading ? (
                <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Menyimpan...</>
              ) : (
                <><Save className="w-4 h-4" />Simpan</>
              )}
            </AnimatedButton>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditCustomerModal;
