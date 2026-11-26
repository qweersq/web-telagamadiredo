import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AnimatedButton from '../components/Design/AnimatedButton';
import api from '../config/api';
import { FaArrowLeft, FaBug, FaCheckCircle } from 'react-icons/fa';

const BugReport = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    description: ''
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    // Clear error when user starts typing
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.title.trim()) {
      setError('Judul harus diisi');
      return;
    }
    
    if (formData.title.trim().length < 5) {
      setError('Judul minimal 5 karakter');
      return;
    }
    
    if (!formData.description.trim()) {
      setError('Deskripsi harus diisi');
      return;
    }
    
    if (formData.description.trim().length < 10) {
      setError('Deskripsi minimal 10 karakter');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await api.post('/bug-reports', {
        title: formData.title.trim(),
        description: formData.description.trim()
      });

      if (response.data.success) {
        setSuccess(true);
        // Reset form
        setFormData({ title: '', description: '' });
      } else {
        setError(response.data.error?.message || 'Gagal mengirim laporan bug');
      }
    } catch (err) {
      console.error('Error sending bug report:', err);
      setError(err.response?.data?.error?.message || 'Terjadi kesalahan saat mengirim laporan bug');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigate(-1);
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
          <FaCheckCircle className="text-6xl text-green-500 mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-gray-900 font-montserrat mb-4">
            Laporan Bug Terkirim!
          </h2>
          <p className="text-gray-600 font-montserrat mb-6">
            Terima kasih atas laporan bug Anda. Tim developer akan segera menangani masalah ini.
          </p>
          <div className="flex gap-3">
            <AnimatedButton
              onClick={() => setSuccess(false)}
              variant="grey"
              className="flex-1 py-3 font-montserrat font-semibold"
            >
              Laporkan Lagi
            </AnimatedButton>
            <AnimatedButton
              onClick={handleBack}
              variant="blue"
              className="flex-1 py-3 font-montserrat font-semibold"
            >
              Kembali
            </AnimatedButton>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <AnimatedButton
              onClick={handleBack}
              variant="grey"
              className="p-2 rounded-lg"
            >
              <FaArrowLeft className="w-5 h-5" />
            </AnimatedButton>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 font-montserrat">
                Laporan Bug
              </h1>
              <p className="text-gray-600 font-montserrat">
                Laporkan bug atau masalah yang Anda temukan di NotaSepatu
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-sm border p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-600 font-montserrat text-sm">{error}</p>
              </div>
            )}

            {/* Title Field */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2 font-montserrat">
                Judul Bug *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-montserrat"
                placeholder="Contoh: Error saat menyimpan order, Tombol tidak berfungsi, dll"
                maxLength={100}
              />
              <p className="text-xs text-gray-500 mt-1 font-montserrat">
                {formData.title.length}/100 karakter
              </p>
            </div>

            {/* Description Field */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2 font-montserrat">
                Deskripsi Detail *
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-montserrat resize-none"
                placeholder="Jelaskan bug secara detail: 1. Langkah-langkah untuk mereproduksi bug 2. Hasil yang diharapkan 3. Hasil yang terjadi 4. Browser/device yang digunakan"
                rows={10}
                maxLength={1000}
              />
              <p className="text-xs text-gray-500 mt-1 font-montserrat">
                {formData.description.length}/1000 karakter
              </p>
            </div>

            {/* Info Box */}
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className="text-orange-500 mt-0.5">
                  <FaBug className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-semibold text-orange-900 font-montserrat text-sm mb-1">
                    Cara Melaporkan Bug yang Efektif
                  </h4>
                  <ul className="text-xs text-orange-800 font-montserrat space-y-1">
                    <li>• Jelaskan langkah-langkah untuk mereproduksi bug</li>
                    <li>• Sertakan hasil yang diharapkan vs yang terjadi</li>
                    <li>• Sebutkan browser dan device yang digunakan</li>
                    <li>• Lampirkan screenshot jika memungkinkan</li>
                    <li>• Laporkan segera setelah menemukan bug</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex gap-3 pt-4">
              <AnimatedButton
                type="button"
                onClick={handleBack}
                variant="grey"
                className="flex-1 py-3 font-montserrat font-semibold"
                disabled={loading}
              >
                Batal
              </AnimatedButton>
              <AnimatedButton
                type="submit"
                variant="red"
                className="flex-1 py-3 font-montserrat font-semibold flex items-center justify-center gap-2"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Mengirim...
                  </>
                ) : (
                  <>
                    <FaBug className="w-4 h-4" />
                    Laporkan Bug
                  </>
                )}
              </AnimatedButton>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default BugReport;
