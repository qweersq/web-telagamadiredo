import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AnimatedButton from '../components/Design/AnimatedButton';
import api from '../config/api';
import { FaArrowLeft, FaPaperPlane, FaCheckCircle } from 'react-icons/fa';

const Feedback = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    subject: '',
    message: ''
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
    if (!formData.subject.trim()) {
      setError('Subject harus diisi');
      return;
    }
    
    if (formData.subject.trim().length < 5) {
      setError('Subject minimal 5 karakter');
      return;
    }
    
    if (!formData.message.trim()) {
      setError('Pesan harus diisi');
      return;
    }
    
    if (formData.message.trim().length < 10) {
      setError('Pesan minimal 10 karakter');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await api.post('/feedback', {
        subject: formData.subject.trim(),
        message: formData.message.trim()
      });

      if (response.data.success) {
        setSuccess(true);
        // Reset form
        setFormData({ subject: '', message: '' });
      } else {
        setError(response.data.error?.message || 'Gagal mengirim feedback');
      }
    } catch (err) {
      console.error('Error sending feedback:', err);
      setError(err.response?.data?.error?.message || 'Terjadi kesalahan saat mengirim feedback');
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
            Feedback Terkirim!
          </h2>
          <p className="text-gray-600 font-montserrat mb-6">
            Terima kasih atas feedback Anda. Tim kami akan meninjau dan merespons secepatnya.
          </p>
          <div className="flex gap-3">
            <AnimatedButton
              onClick={() => setSuccess(false)}
              variant="grey"
              className="flex-1 py-3 font-montserrat font-semibold"
            >
              Kirim Lagi
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
                Feedback & Saran
              </h1>
              <p className="text-gray-600 font-montserrat">
                Bantu kami meningkatkan NotaSepatu dengan feedback Anda
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

            {/* Subject Field */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2 font-montserrat">
                Subject *
              </label>
              <input
                type="text"
                value={formData.subject}
                onChange={(e) => handleInputChange('subject', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-montserrat"
                placeholder="Contoh: Fitur yang diinginkan, Bug yang ditemukan, Saran perbaikan"
                maxLength={100}
              />
              <p className="text-xs text-gray-500 mt-1 font-montserrat">
                {formData.subject.length}/100 karakter
              </p>
            </div>

            {/* Message Field */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2 font-montserrat">
                Pesan Detail *
              </label>
              <textarea
                value={formData.message}
                onChange={(e) => handleInputChange('message', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-montserrat resize-none"
                placeholder="Jelaskan feedback Anda secara detail. Semakin detail, semakin mudah kami memahami dan memperbaikinya."
                rows={8}
                maxLength={1000}
              />
              <p className="text-xs text-gray-500 mt-1 font-montserrat">
                {formData.message.length}/1000 karakter
              </p>
            </div>

            {/* Info Box */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className="text-blue-500 mt-0.5">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-semibold text-blue-900 font-montserrat text-sm mb-1">
                    Tips Feedback yang Baik
                  </h4>
                  <ul className="text-xs text-blue-800 font-montserrat space-y-1">
                    <li>• Jelaskan masalah atau saran dengan spesifik</li>
                    <li>• Sertakan langkah-langkah untuk mereproduksi bug (jika ada)</li>
                    <li>• Berikan konteks tentang kapan masalah terjadi</li>
                    <li>• Feedback Anda akan membantu kami meningkatkan NotaSepatu</li>
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
                variant="blue"
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
                    <FaPaperPlane className="w-4 h-4" />
                    Kirim Feedback
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

export default Feedback;
