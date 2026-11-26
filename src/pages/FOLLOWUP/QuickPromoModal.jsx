import { useState, useEffect } from 'react';
import { X, Send, Image as ImageIcon } from 'lucide-react';
import AnimatedButton from '../../components/Design/AnimatedButton';
import instance from '../../config/api';

const QuickPromoModal = ({ isOpen, onClose }) => {
  const [message, setMessage] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [totalCustomers, setTotalCustomers] = useState(0);
  const [sending, setSending] = useState(false);
  const [sendingProgress, setSendingProgress] = useState(0);

  // Quick templates
  const templates = {
    diskon: '🎉 PROMO SPESIAL! Diskon 30% untuk semua layanan cuci sepatu hari ini! Buruan order sebelum kehabisan slot! 📞',
    cuci2: '👟 PROMO CUCI 2 SEPATU! Hanya Rp 50.000 untuk 2 pasang sepatu. Hemat banget kan? Yuk order sekarang! 💰',
    weekend: '🎊 WEEKEND SPECIAL! Diskon 25% khusus weekend ini. Perfect time untuk refresh sepatu favorit kamu! ✨'
  };

  useEffect(() => {
    if (isOpen) {
      fetchTotalCustomers();
    }
  }, [isOpen]);

  const fetchTotalCustomers = async () => {
    try {
      // Assuming we have an endpoint to get total customers
      // For now, we'll use a placeholder
      setTotalCustomers(150); // Placeholder
    } catch (error) {
      console.error('Error fetching total customers:', error);
      setTotalCustomers(0);
    }
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Hanya file gambar yang diperbolehkan');
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('Ukuran file maksimal 5MB');
        return;
      }
      
      setSelectedFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setFilePreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setFilePreview(null);
  };

  const handleSendBroadcast = async () => {
    if (!message.trim()) {
      alert('Pesan tidak boleh kosong');
      return;
    }

    setSending(true);
    setSendingProgress(0);

    try {
      const formData = new FormData();
      formData.append('message', message);
      if (selectedFile) {
        formData.append('image', selectedFile);
      }

      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setSendingProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      // For now, we'll create a simple broadcast campaign
      // In the future, this could be integrated with the sequences API
      const response = await instance.post('/broadcast-campaigns', {
        name: `Quick Promo - ${new Date().toLocaleDateString()}`,
        message_template: message,
        target_audience: 'all_customers',
        send_immediately: true
      });

      clearInterval(progressInterval);
      setSendingProgress(100);

      if (response.data.success) {
        alert(`🎉 Broadcast berhasil dikirim ke ${totalCustomers} customer!`);
        onClose();
        resetForm();
      }
    } catch (error) {
      console.error('Error sending broadcast:', error);
      alert('❌ Gagal kirim broadcast: ' + (error.response?.data?.message || error.message));
    } finally {
      setSending(false);
      setSendingProgress(0);
    }
  };

  const resetForm = () => {
    setMessage('');
    setSelectedFile(null);
    setFilePreview(null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-800 font-montserrat tracking-wide">
              📢 Quick Broadcast Promo
            </h2>
            <p className="text-sm text-gray-600 font-montserrat">
              Kirim promo langsung ke <strong>{totalCustomers} customer</strong>
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-2"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Quick Templates */}
        <div className="mb-6">
          <h3 className="text-sm font-medium text-gray-700 mb-3 font-montserrat">
            Template Cepat:
          </h3>
          <div className="grid grid-cols-1 gap-2">
            <button
              onClick={() => setMessage(templates.diskon)}
              className="text-left p-3 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
            >
              <div className="font-medium text-blue-800 text-sm font-montserrat">🏷️ Promo Diskon</div>
              <div className="text-xs text-blue-600 font-montserrat truncate">
                {templates.diskon}
              </div>
            </button>
            <button
              onClick={() => setMessage(templates.cuci2)}
              className="text-left p-3 bg-green-50 hover:bg-green-100 rounded-lg transition-colors"
            >
              <div className="font-medium text-green-800 text-sm font-montserrat">👟 Cuci 2 Sepatu</div>
              <div className="text-xs text-green-600 font-montserrat truncate">
                {templates.cuci2}
              </div>
            </button>
            <button
              onClick={() => setMessage(templates.weekend)}
              className="text-left p-3 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors"
            >
              <div className="font-medium text-purple-800 text-sm font-montserrat">🎉 Promo Weekend</div>
              <div className="text-xs text-purple-600 font-montserrat truncate">
                {templates.weekend}
              </div>
            </button>
          </div>
        </div>

        {/* Message Input */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2 font-montserrat">
            Pesan Promo:
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Tulis pesan promo yang menarik..."
            rows={6}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-montserrat resize-none"
          />
          <div className="flex justify-between items-center mt-2">
            <div className="text-xs text-gray-500 font-montserrat">
              {message.length}/1000 karakter
            </div>
            <div className="text-xs text-gray-500 font-montserrat">
              Emoji diperbolehkan 😊
            </div>
          </div>
        </div>

        {/* File Upload */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2 font-montserrat">
            Gambar Promo (Opsional):
          </label>
          
          {!selectedFile ? (
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
                id="file-upload"
              />
              <label htmlFor="file-upload" className="cursor-pointer">
                <div className="flex flex-col items-center">
                  <ImageIcon className="w-8 h-8 text-gray-400 mb-2" />
                  <p className="text-sm text-gray-600 font-montserrat">
                    Klik untuk memilih gambar
                  </p>
                  <p className="text-xs text-gray-500 font-montserrat mt-1">
                    JPG, PNG, GIF (maksimal 5MB)
                  </p>
                </div>
              </label>
            </div>
          ) : (
            <div className="border border-gray-300 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <img src={filePreview} alt="Preview" className="w-16 h-16 object-cover rounded" />
                  <div>
                    <p className="text-sm font-medium text-gray-800 font-montserrat">
                      {selectedFile.name}
                    </p>
                    <p className="text-xs text-gray-500 font-montserrat">
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleRemoveFile}
                  className="text-red-500 hover:text-red-700 p-1"
                  title="Hapus gambar"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="text-xs text-green-600 font-montserrat">
                ✅ Gambar akan dikirim bersama pesan
              </p>
            </div>
          )}
        </div>

        {/* Preview */}
        <div className="mb-6">
          <h3 className="text-sm font-medium text-gray-700 mb-2 font-montserrat">
            Preview Pesan:
          </h3>
          <div className="bg-gray-50 rounded-lg p-4 border">
            <div className="bg-white rounded-lg p-3 shadow-sm">
              {filePreview && (
                <img src={filePreview} alt="Preview" className="w-full max-w-xs rounded mb-2" />
              )}
              <p className="text-sm text-gray-800 font-montserrat whitespace-pre-wrap">
                {message || 'Tulis pesan promo di atas...'}
              </p>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        {sending && (
          <div className="mb-6">
            <div className="flex items-center justify-between text-sm text-gray-600 font-montserrat mb-2">
              <span>Mengirim broadcast...</span>
              <span>{Math.round(sendingProgress)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${sendingProgress}%` }}
              ></div>
            </div>
            <p className="text-xs text-blue-600 font-montserrat mt-1">
              📱 Mengirim ke {totalCustomers} customer...
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <AnimatedButton
            onClick={onClose}
            disabled={sending}
            className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-montserrat font-medium disabled:opacity-50"
            variant="gray"
          >
            Batal
          </AnimatedButton>
          <AnimatedButton
            onClick={handleSendBroadcast}
            disabled={!message.trim() || sending}
            className="flex-1 px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-montserrat font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            variant="blue"
          >
            <Send className="w-4 h-4" />
            {sending ? 'Mengirim...' : `Kirim ke ${totalCustomers} Customer`}
          </AnimatedButton>
        </div>
      </div>
    </div>
  );
};

export default QuickPromoModal;
