import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaBug, FaArrowLeft, FaWhatsapp, FaPaperPlane, FaCheckCircle } from 'react-icons/fa';
import AnimatedButton from '../../components/Design/AnimatedButton';

const BugReportPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    steps: '',
    expectedResult: '',
    actualResult: '',
    priority: 'medium',
    device: '',
    browser: '',
    additionalInfo: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const formatWhatsAppMessage = () => {
    const { title, description, steps, expectedResult, actualResult, priority, device, browser, additionalInfo } = formData;
    
    const priorityText = {
      low: 'RENDAH',
      medium: 'SEDANG', 
      high: 'TINGGI',
      critical: 'KRITIS'
    };

    const message = `*LAPORAN BUG SISTEM - SUPERADMIN*

*Judul:*
${title}

*Deskripsi:*
${description}

*Langkah-langkah:*
${steps}

*Hasil yang Diharapkan:*
${expectedResult}

*Hasil yang Terjadi:*
${actualResult}

*Prioritas:* ${priorityText[priority]}

*Device:* ${device || 'Tidak disebutkan'}

*Browser:* ${browser || 'Tidak disebutkan'}

*Informasi Tambahan:*
${additionalInfo || 'Tidak ada'}

---
*Waktu: ${new Date().toLocaleString('id-ID')}*`;

    return encodeURIComponent(message);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const message = formatWhatsAppMessage();
      const whatsappUrl = `https://wa.me/6287778942773?text=${message}`;
      
      // Open WhatsApp in new tab
      window.open(whatsappUrl, '_blank');
      
      // Simulate submission delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setIsSubmitted(true);
      
      // Reset form after 3 seconds
      setTimeout(() => {
        setIsSubmitted(false);
        setFormData({
          title: '',
          description: '',
          steps: '',
          expectedResult: '',
          actualResult: '',
          priority: 'medium',
          device: '',
          browser: '',
          additionalInfo: ''
        });
      }, 3000);
      
    } catch (error) {
      console.error('Error submitting bug report:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    navigate(-1);
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center"
        >
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <FaCheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4 font-montserrat">
            Laporan Terkirim!
          </h2>
          <p className="text-gray-600 mb-6 font-montserrat">
            Terima kasih telah melaporkan bug. Tim developer akan segera menindaklanjuti laporan Anda.
          </p>
          <AnimatedButton
            onClick={handleBack}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 rounded-xl font-semibold font-montserrat transition-all duration-200"
          >
            Kembali
          </AnimatedButton>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <AnimatedButton
              onClick={handleBack}
              className="w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-xl flex items-center justify-center transition-all duration-200"
            >
              <FaArrowLeft className="w-5 h-5 text-gray-600" />
            </AnimatedButton>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
                <FaBug className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-800 font-montserrat">
                  Laporan Bug Sistem
                </h1>
                <p className="text-sm text-gray-600 font-montserrat">
                  Laporkan bug yang Anda temukan untuk perbaikan sistem
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="bg-white rounded-2xl shadow-xl p-8"
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2 font-montserrat">
                Judul Bug <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 font-montserrat transition-all duration-200"
                placeholder="Contoh: Error saat login dengan akun Google"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2 font-montserrat">
                Deskripsi Bug <span className="text-red-500">*</span>
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                required
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 font-montserrat transition-all duration-200 resize-none"
                placeholder="Jelaskan secara detail apa yang terjadi..."
              />
            </div>

            {/* Steps to Reproduce */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2 font-montserrat">
                Langkah-langkah untuk Menghasilkan Bug <span className="text-red-500">*</span>
              </label>
              <textarea
                name="steps"
                value={formData.steps}
                onChange={handleInputChange}
                required
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 font-montserrat transition-all duration-200 resize-none"
                placeholder="1. Buka halaman login&#10;2. Klik tombol 'Login dengan Google'&#10;3. Pilih akun Google&#10;4. Error muncul..."
              />
            </div>

            {/* Expected vs Actual Result */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 font-montserrat">
                  Hasil yang Diharapkan <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="expectedResult"
                  value={formData.expectedResult}
                  onChange={handleInputChange}
                  required
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 font-montserrat transition-all duration-200 resize-none"
                  placeholder="Seharusnya berhasil login dan masuk ke dashboard"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 font-montserrat">
                  Hasil yang Terjadi <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="actualResult"
                  value={formData.actualResult}
                  onChange={handleInputChange}
                  required
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 font-montserrat transition-all duration-200 resize-none"
                  placeholder="Muncul error 'Authentication failed'"
                />
              </div>
            </div>

            {/* Priority and Device Info */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 font-montserrat">
                  Prioritas <span className="text-red-500">*</span>
                </label>
                <select
                  name="priority"
                  value={formData.priority}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 font-montserrat transition-all duration-200"
                >
                  <option value="low">Rendah</option>
                  <option value="medium">Sedang</option>
                  <option value="high">Tinggi</option>
                  <option value="critical">Kritis</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 font-montserrat">
                  Device
                </label>
                <input
                  type="text"
                  name="device"
                  value={formData.device}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 font-montserrat transition-all duration-200"
                  placeholder="iPhone 13, Samsung Galaxy, dll"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 font-montserrat">
                  Browser
                </label>
                <input
                  type="text"
                  name="browser"
                  value={formData.browser}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 font-montserrat transition-all duration-200"
                  placeholder="Chrome, Safari, Firefox, dll"
                />
              </div>
            </div>

            {/* Additional Info */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2 font-montserrat">
                Informasi Tambahan
              </label>
              <textarea
                name="additionalInfo"
                value={formData.additionalInfo}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 font-montserrat transition-all duration-200 resize-none"
                placeholder="Screenshot, log error, atau informasi lain yang relevan..."
              />
            </div>

            {/* Submit Button */}
            <div className="pt-6">
              <AnimatedButton
                type="submit"
                disabled={isSubmitting}
                className={`w-full py-4 px-6 rounded-xl font-semibold font-montserrat transition-all duration-200 flex items-center justify-center gap-3 ${
                  isSubmitting
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white shadow-lg hover:shadow-xl'
                }`}
              >
                {isSubmitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Mengirim...
                  </>
                ) : (
                  <>
                    <FaWhatsapp className="w-5 h-5" />
                    <FaPaperPlane className="w-4 h-4" />
                    Kirim ke WhatsApp
                  </>
                )}
              </AnimatedButton>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
};

export default BugReportPage;
